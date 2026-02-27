import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Diagnostic : source du mot de passe (Supabase ou env).
 */
export async function GET() {
  let source = "env";
  let configured = !!process.env.CRM_PASSWORD;

  if (isSupabaseConfigured()) {
    try {
      const { data: hash } = await supabase.rpc("get_config", {
        p_key: "crm_password_hash",
      });
      if (hash) {
        source = "supabase";
        configured = true;
      }
    } catch {
      // ignore
    }
  }

  return NextResponse.json({
    source,
    configured,
    envLength: process.env.CRM_PASSWORD?.length ?? 0,
    hint: source === "supabase" ? "Mot de passe depuis Supabase" : "Mot de passe depuis CRM_PASSWORD",
  });
}
