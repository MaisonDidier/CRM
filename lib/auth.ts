import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";

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
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;

  cookieStore.set(SESSION_COOKIE_NAME, sessionSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge,
    path: "/",
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
  const correctPassword = process.env.CRM_PASSWORD;
  if (!correctPassword) {
    // Ne pas logger d'informations sensibles en production
    if (process.env.NODE_ENV !== "production") {
      console.error("❌ CRM_PASSWORD n'est pas défini dans process.env");
    }
    throw new Error("CRM_PASSWORD n'est pas configuré dans les variables d'environnement");
  }
  
  // Comparaison sécurisée contre les attaques par timing
  const inputBuffer = Buffer.from(password.trim(), "utf8");
  const correctBuffer = Buffer.from(correctPassword.trim(), "utf8");
  
  if (inputBuffer.length !== correctBuffer.length) {
    // Délai constant même en cas d'échec
    timingSafeEqual(Buffer.alloc(correctBuffer.length), Buffer.alloc(correctBuffer.length));
    return false;
  }
  
  return timingSafeEqual(inputBuffer, correctBuffer);
}

