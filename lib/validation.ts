// Constantes de validation
const MAX_LENGTH = {
  prenom: 100,
  nom: 100,
  telephone: 20,
  message_relance: 2000,
};

/**
 * Normalise les apostrophes typographiques (Word, Google Docs, etc.)
 * en apostrophes droites pour éviter les caractères bizarres (â€™, etc.)
 * - U+2019 ' (RIGHT SINGLE QUOTATION MARK) -> '
 * - U+2018 ' (LEFT SINGLE QUOTATION MARK) -> '
 * - U+00B4 ´ (ACUTE ACCENT utilisé comme apostrophe) -> '
 * - &#x27; / &#39; (entités HTML stockées par erreur) -> '
 */
export function normalizeApostrophes(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/\u2019/g, "'") // ' typographique
    .replace(/\u2018/g, "'") // ' typographique
    .replace(/\u00B4/g, "'") // ´ accent aigu
    .replace(/&#x27;/g, "'") // entité HTML (legacy)
    .replace(/&#39;/g, "'") // entité HTML (legacy)
    .trim();
}

/**
 * Nettoie et normalise une chaîne pour le stockage.
 * Conserve les apostrophes (d'Angelo, l'église) mais normalise les variantes typographiques.
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";
  return normalizeApostrophes(input);
}

/**
 * Échappe le HTML pour affichage sécurisé (emails, etc.)
 * À utiliser uniquement lors de l'injection dans du HTML.
 */
export function escapeHtmlForDisplay(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Fonction de validation de longueur
export function validateLength(field: string, value: string, maxLength: number): boolean {
  if (typeof value !== "string") {
    return false;
  }
  return value.trim().length > 0 && value.trim().length <= maxLength;
}

// Fonction de validation du nom/prénom
export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== "string") {
    return { valid: false, error: "Le nom est requis" };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: "Le nom ne peut pas être vide" };
  }
  
  if (trimmed.length > MAX_LENGTH.prenom) {
    return { valid: false, error: `Le nom ne peut pas dépasser ${MAX_LENGTH.prenom} caractères` };
  }
  
  // Vérifier qu'il n'y a pas de caractères dangereux (XSS) - les apostrophes sont autorisées (d'Angelo, l'Église)
  if (/[<>"]/.test(trimmed)) {
    return { valid: false, error: "Le nom contient des caractères invalides" };
  }
  
  return { valid: true };
}

// Fonction de validation du numéro de téléphone
// Accepte les formats français et internationaux
export function validatePhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== "string") {
    return false;
  }

  // Vérifier la longueur
  if (phone.trim().length > MAX_LENGTH.telephone) {
    return false;
  }

  // Supprimer les espaces, tirets, points et autres caractères de formatage
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, "");

  // Vérifier que ce sont uniquement des chiffres (et éventuellement + au début)
  if (!/^\+?[0-9]+$/.test(cleaned)) {
    return false;
  }

  // Format français : 10 chiffres (peut commencer par 0 ou +33)
  const frenchPattern = /^(0|\+33)[1-9][0-9]{8}$/;
  const simplePattern = /^0[1-9][0-9]{8}$/; // Format simple 0X XX XX XX XX
  const internationalPattern = /^\+[1-9][0-9]{6,14}$/; // Format international

  // Normaliser le format français avec +33
  const normalized = cleaned.startsWith("0")
    ? "+33" + cleaned.substring(1)
    : cleaned.startsWith("33")
    ? "+" + cleaned
    : cleaned.startsWith("+")
    ? cleaned
    : cleaned;

  return (
    frenchPattern.test(cleaned) ||
    internationalPattern.test(normalized) ||
    simplePattern.test(cleaned) ||
    /^[0-9]{10}$/.test(cleaned) // 10 chiffres simples
  );
}

// Fonction de validation du message de relance
export function validateMessage(message: string): { valid: boolean; error?: string } {
  if (typeof message !== "string") {
    return { valid: false, error: "Le message doit être une chaîne de caractères" };
  }
  
  if (message.length > MAX_LENGTH.message_relance) {
    return { valid: false, error: `Le message ne peut pas dépasser ${MAX_LENGTH.message_relance} caractères` };
  }
  
  return { valid: true };
}

