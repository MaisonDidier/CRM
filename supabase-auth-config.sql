-- Mot de passe stocké dans Supabase (contourne les soucis de variables Vercel)
-- 1. Exécutez ce script dans l'éditeur SQL Supabase
-- 2. Puis: node scripts/generate-password-hash.js
-- 3. Exécutez l'INSERT généré dans Supabase

CREATE TABLE IF NOT EXISTS site_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all direct access" ON site_config
  FOR ALL USING (false);

CREATE OR REPLACE FUNCTION get_config(p_key TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value FROM site_config WHERE key = p_key;
$$;

GRANT EXECUTE ON FUNCTION get_config(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_config(TEXT) TO authenticated;
