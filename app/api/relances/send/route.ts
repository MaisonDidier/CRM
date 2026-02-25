import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Configuration des services d'envoi
const USE_EMAIL = process.env.ENABLE_EMAIL_RELANCE === "true";
// Pour les SMS, on utilise désormais Brevo. On active si une clé API est présente.
const USE_SMS = !!process.env.BREVO_API_KEY;

interface RelanceClient {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  message_relance: string;
  date_relance: string;
}

/**
 * Envoie un email via Resend (gratuit jusqu'à 3000 emails/mois)
 */
async function sendEmail(client: RelanceClient): Promise<boolean> {
  if (!USE_EMAIL || !process.env.RESEND_API_KEY) {
    return false;
  }

  try {
    const message = client.message_relance.replace("{{prenom}}", client.prenom);
    const fromEmail = process.env.EMAIL_FROM || "noreply@votredomaine.com";
    const toEmail = process.env.EMAIL_TO || "contact@votredomaine.com"; // Email de test

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail], // Pour l'instant, on envoie à un email de test
        subject: `Relance pour ${client.prenom} ${client.nom}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Relance client</h2>
            <p><strong>Client:</strong> ${client.prenom} ${client.nom}</p>
            <p><strong>Téléphone:</strong> ${client.telephone}</p>
            <hr>
            <p><strong>Message à envoyer:</strong></p>
            <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
              ${message.replace(/\n/g, "<br>")}
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Ce message doit être envoyé manuellement au client par SMS ou téléphone.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Erreur Resend:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    return false;
  }
}

async function sendSMS(
  client: RelanceClient,
  debugError?: (err: unknown) => void
): Promise<boolean> {
  if (!USE_SMS || !process.env.BREVO_API_KEY) {
    return false;
  }

  try {
    const senderName = process.env.BREVO_SMS_SENDER || "MaisonDidier";
    const rawMessage = (client.message_relance || "").replace("{{prenom}}", client.prenom);
    const content = `Maison Didier - ${rawMessage}`;

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

    if (!response.ok) {
      const errorData = await response.json();
      const errMsg = JSON.stringify(errorData);
      console.error("Erreur Brevo SMS:", errMsg);
      debugError?.(errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi du SMS via Brevo:", error);
    debugError?.(error);
    return false;
  }
}

/**
 * Marque une relance comme envoyée dans la base de données
 */
async function markRelanceSent(clientId: string): Promise<void> {
  try {
    // Mettre à jour la date de relance pour éviter les doublons
    // On ajoute 1 jour pour éviter de renvoyer le même jour
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await supabase
      .from("clients")
      .update({ 
        date_relance: tomorrow.toISOString(),
        relance_envoyee_at: new Date().toISOString()
      })
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
 * Endpoint pour envoyer les relances (appelé par le cron job ou manuellement)
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

    for (const client of clients) {
      let emailSent = false;
      let smsSent = false;

      if (USE_EMAIL) {
        emailSent = await sendEmail(client);
      }
      if (USE_SMS) {
        smsSent = await sendSMS(client, (err) => {
          if (debugMode) debugErrors.push({ client: `${client.prenom} ${client.nom}`, error: err });
        });
      }

      if (emailSent || smsSent) {
        await markRelanceSent(client.id);
        results.push({
          clientId: client.id,
          name: `${client.prenom} ${client.nom}`,
          emailSent,
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
        useEmail: USE_EMAIL,
        todayParis: getTodayParis(),
        smsErrors: debugErrors.length > 0 ? debugErrors : undefined,
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

