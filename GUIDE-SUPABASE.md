# Guide : Configuration Supabase

## Étape 1 : Récupérer les identifiants Supabase

1. Allez sur [https://supabase.com](https://supabase.com) et connectez-vous
2. Sélectionnez votre projet
3. Allez dans **Settings** (Paramètres) → **API**
4. Vous verrez deux informations importantes :

   **Project URL** (URL du projet)
   ```
   https://xxxxx.supabase.co
   ```
   
   **anon public key** (Clé publique anonyme)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Étape 2 : Ajouter les identifiants dans .env.local

1. Ouvrez le fichier `.env.local` (voir guide précédent si besoin)
2. Trouvez ces lignes :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_supabase
   ```

3. Remplacez-les par vos vraies valeurs :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   ⚠️ **Important** : Copiez-collez exactement les valeurs, sans espaces supplémentaires

## Étape 3 : Créer la table clients dans Supabase

1. Dans votre projet Supabase, allez dans **SQL Editor** (Éditeur SQL)
2. Cliquez sur **New query** (Nouvelle requête)
3. Copiez-collez ce script SQL :

```sql
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  telephone TEXT NOT NULL,
  message_relance TEXT,
  date_relance TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Créer un index pour améliorer les performances de tri
CREATE INDEX IF NOT EXISTS idx_clients_date_relance ON clients(date_relance);
```

4. Cliquez sur **Run** (Exécuter) ou appuyez sur `Cmd+Enter`
5. Vous devriez voir un message de succès

## Étape 4 : Vérifier que la table est créée

1. Dans Supabase, allez dans **Table Editor** (Éditeur de table)
2. Vous devriez voir la table `clients` dans la liste
3. Cliquez dessus pour voir sa structure

## Étape 5 : Redémarrer le serveur

**IMPORTANT** : Après avoir modifié `.env.local`, vous DEVEZ redémarrer le serveur :

1. Arrêtez le serveur (Ctrl+C dans le terminal)
2. Relancez avec : `npm run dev`

## Étape 6 : Tester la connexion

1. Connectez-vous à l'application avec votre mot de passe
2. Essayez d'ajouter un client
3. Si tout fonctionne, vous verrez le client apparaître dans la liste

## 🐛 Dépannage

### Erreur "Supabase n'est pas configuré"
- Vérifiez que les variables sont bien dans `.env.local`
- Vérifiez qu'il n'y a pas d'espaces avant/après le `=`
- Redémarrez le serveur

### Erreur "relation 'clients' does not exist"
- La table n'a pas été créée
- Retournez dans SQL Editor et exécutez le script SQL

### Erreur de connexion à Supabase
- Vérifiez que l'URL est correcte (commence par `https://`)
- Vérifiez que la clé API est complète (elle est très longue)





