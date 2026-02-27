import { cookies } from "next/headers";
import { timingSafeEqual, scryptSync } from "crypto";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const SESSION_COOKIE_NAME = "crm_session";

// Utiliser une variable d'environnement pour le secret de session
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || "authenticated";
  if (process.env.NODE_ENV === "production" && secret === "authenticated") {
    console.error("⚠️  SESSION_SECRET doit être défini en production !");
  }
  return secret;
}

export async function createSession(rememberMe: boolean = false) {
  const cookieStore = await cookies();
  const sessionSecret = getSessionSecret();

  // Durée de la session : 7 jours par défaut, 30 jours si "Rester connecté"
  const maxAgeSeconds = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;

  cookieStore.set(SESSION_COOKIE_NAME, sessionSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  const sessionSecret = getSessionSecret();
  
  if (!session?.value) {
    return false;
  }
  
  // Utiliser une comparaison sécurisée contre les attaques par timing
  try {
    const sessionBuffer = Buffer.from(session.value, "utf8");
    const secretBuffer = Buffer.from(sessionSecret, "utf8");
    
    if (sessionBuffer.length !== secretBuffer.length) {
      return false;
    }
    
    return timingSafeEqual(sessionBuffer, secretBuffer);
  } catch {
    return false;
  }
}

export async function verifyPassword(password: string): Promise<boolean> {
  const input = password.trim();
  const sessionSecret = getSessionSecret();

  // 1. Priorité : mot de passe depuis Supabase (contourne les bugs Vercel env)
  if (isSupabaseConfigured()) {
    try {
      const { data: hash, error } = await supabase.rpc("get_config", {
        p_key: "crm_password_hash",
      });
      if (!error && hash && typeof hash === "string") {
        const inputHash = scryptSync(input, sessionSecret, 64).toString("base64");
        return timingSafeEqual(Buffer.from(inputHash, "utf8"), Buffer.from(hash, "utf8"));
      }
    } catch {
      // Fallback vers CRM_PASSWORD
    }
  }

  // 2. Fallback : variable d'environnement CRM_PASSWORD
  const correctPassword = process.env.CRM_PASSWORD;
  if (!correctPassword) {
    if (process.env.NODE_ENV !== "production") {
      console.error("❌ CRM_PASSWORD non défini et Supabase sans hash");
    }
    throw new Error("Mot de passe non configuré (Supabase ou CRM_PASSWORD)");
  }

  const inputBuffer = Buffer.from(input, "utf8");
  const correctBuffer = Buffer.from(correctPassword.trim(), "utf8");
  if (inputBuffer.length !== correctBuffer.length) {
    timingSafeEqual(Buffer.alloc(correctBuffer.length), Buffer.alloc(correctBuffer.length));
    return false;
  }
  return timingSafeEqual(inputBuffer, correctBuffer);
}

