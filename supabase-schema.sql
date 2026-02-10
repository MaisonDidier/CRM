-- Script SQL pour créer la table clients dans Supabase
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  telephone TEXT NOT NULL,
  message_relance TEXT,
  date_relance TIMESTAMP,
  relance_envoyee_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Optionnel : Créer un index sur date_relance pour améliorer les performances de tri
CREATE INDEX IF NOT EXISTS idx_clients_date_relance ON clients(date_relance);

-- Index pour les relances envoyées
CREATE INDEX IF NOT EXISTS idx_clients_relance_envoyee ON clients(relance_envoyee_at);

