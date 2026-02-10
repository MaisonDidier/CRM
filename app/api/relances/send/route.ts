import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Configuration des services d'envoi
const USE_EMAIL = process.env.ENABLE_EMAIL_RELANCE === "true";
const USE_SMS = process.env.ENABLE_SMS_RELANCE === "true";

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

/**
 * Envoie un SMS via Twilio (payant, ~0.05€ par SMS en France)
 */
async function sendSMS(client: RelanceClient): Promise<boolean> {
  if (!USE_SMS || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return false;
  }

  try {
    const message = client.message_relance.replace("{{prenom}}", client.prenom);
    const fromNumber = process.env.TWILIO_PHONE_NUMBER; // Format: +33612345678

    // Normaliser le numéro de téléphone
    let toNumber = client.telephone;
    if (toNumber.startsWith("0")) {
      toNumber = "+33" + toNumber.substring(1);
    } else if (!toNumber.startsWith("+")) {
      toNumber = "+33" + toNumber;
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          From: fromNumber!,
          To: toNumber,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Erreur Twilio:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi du SMS:", error);
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

/**
 * Récupère tous les clients dont la date de relance est aujourd'hui ou passée
 */
async function getClientsToRelance(): Promise<RelanceClient[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .not("date_relance", "is", null)
    .lte("date_relance", today.toISOString());

  if (error) {
    throw error;
  }

  // Filtrer côté application les relances déjà envoyées aujourd'hui
  // (pour éviter les problèmes si la colonne n'existe pas encore)
  const clients = (data || []) as (RelanceClient & { relance_envoyee_at?: string | null })[];
  
  return clients.filter((client) => {
    // Si relance_envoyee_at existe et est aujourd'hui, on ignore
    if (client.relance_envoyee_at) {
      const sentDate = new Date(client.relance_envoyee_at);
      sentDate.setHours(0, 0, 0, 0);
      return sentDate.getTime() !== today.getTime();
    }
    return true;
  }) as RelanceClient[];
}

/**
 * Endpoint pour envoyer les relances (appelé par le cron job)
 */
export async function POST(request: Request) {
  try {
    // Vérifier l'authentification via un token secret (pour le cron job)
    // CRITIQUE: Exiger toujours CRON_SECRET en production
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Configuration manquante" },
          { status: 500 }
        );
      }
      // En développement, permettre l'accès sans secret (mais avec un avertissement)
      console.warn("⚠️  CRON_SECRET non défini - accès non sécurisé en développement");
    } else {
      // Vérifier le token
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        // Délai constant pour éviter les attaques par timing
        await new Promise((resolve) => setTimeout(resolve, 100));
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase n'est pas configuré" },
        { status: 500 }
      );
    }

    const clients = await getClientsToRelance();
    const results = [];

    for (const client of clients) {
      let emailSent = false;
      let smsSent = false;

      // Essayer d'envoyer par email
      if (USE_EMAIL) {
        emailSent = await sendEmail(client);
      }

      // Essayer d'envoyer par SMS
      if (USE_SMS) {
        smsSent = await sendSMS(client);
      }

      // Si au moins un envoi a réussi, marquer comme envoyé
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

    return NextResponse.json({
      success: true,
      clientsProcessed: results.length,
      results,
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi des relances:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des relances" },
      { status: 500 }
    );
  }
}

/**
 * Endpoint GET pour tester manuellement (nécessite authentification)
 */
export async function GET(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase n'est pas configuré" },
        { status: 500 }
      );
    }

    const clients = await getClientsToRelance();

    return NextResponse.json({
      clientsToRelance: clients.length,
      clients: clients.map((c) => ({
        id: c.id,
        name: `${c.prenom} ${c.nom}`,
        telephone: c.telephone,
        date_relance: c.date_relance,
      })),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des relances:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des relances" },
      { status: 500 }
    );
  }
}

