# CRM Opticien

Application web interne privée pour la gestion des clients d'un opticien.

## Configuration

### Variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

```env
CRM_PASSWORD=votre_mot_de_passe_securise
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_supabase
```

### Base de données Supabase

Créez une table `clients` dans Supabase avec la structure suivante :

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  telephone TEXT NOT NULL,
  message_relance TEXT,
  date_relance TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## Déploiement

L'application est prête à être déployée sur Vercel. Assurez-vous de configurer les variables d'environnement dans les paramètres du projet Vercel.

## Sécurité

- L'authentification se fait via un mot de passe unique stocké dans `CRM_PASSWORD`
- Les sessions sont gérées via des cookies HttpOnly sécurisés
- Toutes les routes sont protégées par un middleware
- Aucune donnée sensible n'est exposée côté client





