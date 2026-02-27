import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Diagnostic : vérifie que CRM_PASSWORD est chargé (sans révéler la valeur).
 * À supprimer après vérification.
 */
export async function GET() {
  const pwd = process.env.CRM_PASSWORD;
  return NextResponse.json({
    configured: !!pwd,
    length: pwd?.length ?? 0,
    hint: pwd ? "clukoptic = 9 caractères" : "non configuré",
  });
}
