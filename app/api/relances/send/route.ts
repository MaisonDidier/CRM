import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { normalizeApostrophes } from "@/lib/validation";

export const dynamic = "force-dynamic";

const USE_SMS = !!process.env.BREVO_API_KEY;

interface RelanceClient {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  message_relance: string;
  date_relance: string;
}

async function sendSMS(
  client: RelanceClient,
  debugError?: (err: unknown) => void,
  debugResponse?: (res: unknown) => void
): Promise<boolean> {
  if (!USE_SMS || !process.env.BREVO_API_KEY) {
    return false;
  }

  try {
    // Brevo exige max 11 caractères pour le sender alphanumérique
    const rawSender = process.env.BREVO_SMS_SENDER || "MaisonDidier";
    const senderName = rawSender.replace(/\s/g, "").slice(0, 11);
    const prenom = normalizeApostrophes(client.prenom);
    const rawMessage = (client.message_relance || "").replace("{{prenom}}", prenom);
    const content = normalizeApostrophes(rawMessage);

    let recipient = client.telephone.replace(/[\s\-\.\(\)]/g, "");
    if (recipient.startsWith("+33")) {
      recipient = "33" + recipient.substring(3);
    } else if (recipient.startsWith("0")) {
      recipient = "33" + recipient.substring(1);
    } else if (recipient.startsWith("+")) {
      recipient = recipient.substring(1);
    }

    const response = await fetch("https://api.brevo.com/v3/transactionalSMS/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: senderName,
        recipient,
        content,
        type: "transactional",
      }),
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = JSON.stringify(responseData);
      console.error("Erreur Brevo SMS:", errMsg);
      debugError?.({ status: response.status, ...responseData });
      return false;
    }

    // En mode debug : capturer la réponse Brevo
    debugResponse?.({ status: response.status, ...responseData });

    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi du SMS via Brevo:", error);
    debugError?.(error);
    return false;
  }
}

/**
 * Marque une relance comme envoyée (évite les doublons le même jour)
 * Ne modifie pas date_relance, uniquement relance_envoyee_at
 */
async function markRelanceSent(clientId: string): Promise<void> {
  try {
    await supabase
      .from("clients")
      .update({ relance_envoyee_at: new Date().toISOString() })
      .eq("id", clientId);
  } catch (error) {
    console.error("Erreur lors du marquage de la relance:", error);
  }
}

const PARIS_TZ = "Europe/Paris";

/**
 * Retourne la date du jour au format YYYY-MM-DD dans le fuseau Europe/Paris
 */
function getTodayParis(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: PARIS_TZ });
}

/**
 * Retourne l'offset Paris (ex: +01:00 ou +02:00) pour gérer l'heure d'été
 */
function getParisOffset(): string {
  const str = new Date().toLocaleString("en-US", {
    timeZone: PARIS_TZ,
    timeZoneName: "longOffset",
  });
  const match = str.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (match) {
    const sign = match[1];
    const h = match[2].padStart(2, "0");
    const m = (match[3] || "00").padStart(2, "0");
    return `${sign}${h}:${m}`;
  }
  return "+01:00";
}

/**
 * Récupère tous les clients dont la date de relance est aujourd'hui ou passée
 * Utilise le fuseau Europe/Paris pour être cohérent avec l'affichage côté client
 */
async function getClientsToRelance(): Promise<RelanceClient[]> {
  const todayStr = getTodayParis();
  const offset = getParisOffset().replace("GMT", "");
  const endOfTodayParis = new Date(`${todayStr}T23:59:59.999${offset}`);
  const endOfTodayUTC = endOfTodayParis.toISOString();

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .not("date_relance", "is", null)
    .lte("date_relance", endOfTodayUTC);

  if (error) {
    throw error;
  }

  // Filtrer côté application les relances déjà envoyées aujourd'hui (Paris)
  const clients = (data || []) as (RelanceClient & { relance_envoyee_at?: string | null })[];
  const todayParis = getTodayParis();

  return clients.filter((client) => {
    if (client.relance_envoyee_at) {
      const sentDateStr = new Date(client.relance_envoyee_at).toLocaleDateString("en-CA", {
        timeZone: "Europe/Paris",
      });
      return sentDateStr !== todayParis;
    }
    return true;
  }) as RelanceClient[];
}

/**
 * Vérifie si la requête est autorisée (cron secret uniquement - relances automatiques)
 */
function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  if (!cronSecret && process.env.NODE_ENV !== "production") {
    console.warn("⚠️  CRON_SECRET non défini - accès non sécurisé en développement");
    return true;
  }

  return false;
}

/**
 * GET : diagnostic sans envoi - vérifie la config et liste les clients éligibles
 */
export async function GET(request: Request) {
  try {
    const authorized = isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        ok: false,
        error: "Supabase non configuré",
        todayParis: getTodayParis(),
      });
    }

    const clients = await getClientsToRelance();
    const todayStr = getTodayParis();
    const offset = getParisOffset().replace("GMT", "");
    const endOfTodayParis = new Date(`${todayStr}T23:59:59.999${offset}`);
    const endOfTodayUTC = endOfTodayParis.toISOString();

    return NextResponse.json({
      ok: true,
      diagnostic: {
        todayParis: todayStr,
        endOfTodayUTC,
        useSms: USE_SMS,
        hasBrevoKey: !!process.env.BREVO_API_KEY,
        clientsEligibles: clients.length,
        clients: clients.map((c) => ({
          prenom: c.prenom,
          nom: c.nom,
          telephone: c.telephone,
          date_relance: c.date_relance,
        })),
      },
    });
  } catch (error) {
    console.error("Erreur diagnostic relances:", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST : envoie les relances (appelé par le cron job ou manuellement)
 */
export async function POST(request: Request) {
  try {
    const authorized = isAuthorized(request);
    if (!authorized) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase n'est pas configuré" },
        { status: 500 }
      );
    }

    const clients = await getClientsToRelance();
    const results = [];
    const debugMode = request.headers.get("x-debug") === "1";
    const debugErrors: { client: string; error: unknown }[] = [];
    const debugBrevoResponses: { client: string; response: unknown }[] = [];

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      let smsSent = false;

      // Délai 5s entre chaque envoi (certains clients ne reçoivent pas avec 2s)
      if (i > 0) {
        await new Promise((r) => setTimeout(r, 5000));
      }

      if (USE_SMS) {
        smsSent = await sendSMS(
          client,
          (err) => {
            console.error(`SMS échoué pour ${client.prenom} ${client.nom}:`, err);
            if (debugMode) debugErrors.push({ client: `${client.prenom} ${client.nom}`, error: err });
          },
          (res) => {
            if (debugMode) debugBrevoResponses.push({ client: `${client.prenom} ${client.nom}`, response: res });
          }
        );
      }

      if (smsSent) {
        await markRelanceSent(client.id);
        results.push({
          clientId: client.id,
          name: `${client.prenom} ${client.nom}`,
          smsSent,
        });
      }
    }

    const response: Record<string, unknown> = {
      success: true,
      clientsProcessed: results.length,
      results,
    };
    if (debugMode) {
      response.debug = {
        clientsFound: clients.length,
        useSms: USE_SMS,
        todayParis: getTodayParis(),
        smsErrors: debugErrors.length > 0 ? debugErrors : undefined,
        brevoResponses: debugBrevoResponses,
        clients: clients.map((c) => ({
          name: `${c.prenom} ${c.nom}`,
          telephone: c.telephone,
          date_relance: c.date_relance,
        })),
      };
    }
    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur lors de l'envoi des relances:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des relances" },
      { status: 500 }
    );
  }
}

