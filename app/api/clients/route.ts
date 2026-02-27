import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { isAuthenticated } from "@/lib/auth";
import { validatePhoneNumber, validateName, validateMessage, sanitizeString } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase n'est pas configuré. Veuillez définir NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local" },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur lors de la récupération des clients:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des clients" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase n'est pas configuré. Veuillez définir NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local" },
        { status: 500 }
      );
    }

    const body = await request.json();
    let { prenom, nom, telephone, message_relance, date_relance } = body;

    // Sanitization des entrées
    prenom = sanitizeString(prenom || "");
    nom = sanitizeString(nom || "");
    telephone = sanitizeString(telephone || "");
    message_relance = sanitizeString(message_relance || "");

    // Validation du prénom
    const prenomValidation = validateName(prenom);
    if (!prenomValidation.valid) {
      return NextResponse.json(
        { error: prenomValidation.error || "Prénom invalide" },
        { status: 400 }
      );
    }

    // Validation du nom
    const nomValidation = validateName(nom);
    if (!nomValidation.valid) {
      return NextResponse.json(
        { error: nomValidation.error || "Nom invalide" },
        { status: 400 }
      );
    }

    // Validation du téléphone
    if (!telephone) {
      return NextResponse.json(
        { error: "Le téléphone est requis" },
        { status: 400 }
      );
    }

    if (!validatePhoneNumber(telephone)) {
      return NextResponse.json(
        { error: "Format de numéro de téléphone invalide. Utilisez un format valide (ex: 0612345678 ou +33612345678)" },
        { status: 400 }
      );
    }

    // Validation du message de relance
    if (message_relance) {
      const messageValidation = validateMessage(message_relance);
      if (!messageValidation.valid) {
        return NextResponse.json(
          { error: messageValidation.error || "Message invalide" },
          { status: 400 }
        );
      }
    }

    // Validation de la date de relance si fournie
    if (date_relance) {
      const date = new Date(date_relance);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: "Format de date invalide" },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase
      .from("clients")
      .insert([
        {
          prenom: prenom.trim(),
          nom: nom.trim(),
          telephone: telephone.trim(),
          message_relance: message_relance.trim() || "",
          date_relance: date_relance || null,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du client:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du client" },
      { status: 500 }
    );
  }
}

