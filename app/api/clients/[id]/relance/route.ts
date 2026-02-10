import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const { date_relance } = body;

    if (!date_relance) {
      return NextResponse.json(
        { error: "Date de relance requise" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("clients")
      .update({ date_relance })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la date de relance:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la date de relance" },
      { status: 500 }
    );
  }
}

