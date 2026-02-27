/**
 * Génère le hash du mot de passe pour Supabase.
 * Usage: node scripts/generate-password-hash.js
 * Utilise SESSION_SECRET depuis .env.local comme sel.
 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ .env.local introuvable");
  process.exit(1);
}

const env = fs.readFileSync(envPath, "utf8");
let sessionSecret = "";
env.split("\n").forEach((line) => {
  const m = line.match(/^SESSION_SECRET=(.*)$/);
  if (m) sessionSecret = m[1].trim();
});

if (!sessionSecret) {
  console.error("❌ SESSION_SECRET manquant dans .env.local");
  process.exit(1);
}

const password = process.argv[2] || "clukoptic";
const hash = crypto.scryptSync(password, sessionSecret, 64).toString("base64");

console.log("\n📋 Hash pour le mot de passe:", password);
console.log("\nExécutez ce SQL dans Supabase (après avoir lancé supabase-auth-config.sql) :\n");
console.log(
  `INSERT INTO site_config (key, value) VALUES ('crm_password_hash', '${hash}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`
);
console.log("");
