import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Fonction helper pour vérifier si Supabase est configuré
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== "" && supabaseAnonKey !== "");
}

// Créer le client Supabase seulement si configuré
// Utiliser des valeurs par défaut pour permettre le build même sans configuration
const defaultUrl = "https://placeholder.supabase.co";
const defaultKey = "placeholder-key";

export const supabase = createClient(
  isSupabaseConfigured() ? supabaseUrl : defaultUrl,
  isSupabaseConfigured() ? supabaseAnonKey : defaultKey
);

