# Guide des relances SMS automatiques

Ce guide vous explique comment configurer les relances automatiques par SMS pour votre CRM.

## 📱 Relances SMS (Brevo)

- **Coût** : ~0.05€ par SMS en France
- **Service** : Brevo (ex-Sendinblue)
- Les SMS sont envoyés directement au numéro du client

## 📋 Installation étape par étape

### Étape 1: Mettre à jour la base de données

Exécutez ce script SQL dans Supabase pour ajouter le champ de suivi des relances :

```sql
-- Ajouter la colonne pour tracker les relances envoyées
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS relance_envoyee_at TIMESTAMP;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_clients_relance_envoyee 
ON clients(relance_envoyee_at);
```

### Étape 2: Configurer les variables d'environnement

1. Copiez `.env.example` vers `.env.local`
2. Générez un secret pour le cron job :
   ```bash
   openssl rand -base64 32
   ```
3. Ajoutez dans `.env.local` :
   - `CRON_SECRET` : le secret généré
   - `BREVO_API_KEY` : votre clé API Brevo
   - `BREVO_SMS_SENDER` (optionnel) : nom de l'expéditeur SMS (max 11 caractères)

### Étape 3: Configuration Brevo

1. **Créer un compte Brevo** : https://www.brevo.com
2. **Obtenir votre clé API** :
   - Dashboard Brevo → Paramètres → Clés API
   - Créez une clé API avec les droits SMS
3. **Configurer dans `.env.local`** :
   ```
   BREVO_API_KEY=votre_cle_api_brevo
   BREVO_SMS_SENDER=MaisonDidier
   ```

### Étape 4: Configurer le cron job

#### Option A: Vercel Cron Jobs (recommandé)

Le cron est configuré dans `vercel.json` (exécution quotidienne à 9h15 Paris).
Assurez-vous que `CRON_SECRET` est défini dans Vercel → Settings → Environment Variables.

#### Option B: Cron-job.org

1. Allez sur https://cron-job.org
2. Créez un nouveau job :
   - **URL** : `https://votre-app.vercel.app/api/relances/send`
   - **Method** : POST
   - **Headers** : `Authorization: Bearer VOTRE_CRON_SECRET`
   - **Schedule** : Tous les jours à l'heure souhaitée (fuseau Europe/Paris)

### Étape 5: Tester

**Diagnostic (sans envoi)** :
```bash
curl -X GET "https://votre-app.vercel.app/api/relances/send" \
  -H "Authorization: Bearer VOTRE_CRON_SECRET"
```

**Test d'envoi** :
```bash
curl -X POST "https://votre-app.vercel.app/api/relances/send" \
  -H "Authorization: Bearer VOTRE_CRON_SECRET"
```

## 🔄 Fonctionnement

1. Le cron appelle `/api/relances/send` chaque jour
2. Le système récupère les clients dont `date_relance <= aujourd'hui`
3. Pour chaque client, un SMS est envoyé au numéro de téléphone
4. La relance est marquée comme envoyée pour éviter les doublons

## 🛠️ Dépannage

### Le cron retourne 401
- Vérifiez que `CRON_SECRET` est défini dans Vercel
- Si vous utilisez cron-job.org : l'en-tête doit être `Authorization: Bearer VOTRE_SECRET` (avec "Bearer " devant)

### Les SMS ne partent pas
- Vérifiez que `BREVO_API_KEY` est correcte
- Vérifiez que votre compte Brevo a des crédits SMS
- Les numéros doivent être au format français (06...) ou international (+33...)
- Consultez les logs Vercel pour les erreurs détaillées

### Aucun client relancé
- Utilisez le GET `/api/relances/send` (avec Authorization) pour le diagnostic
- Vérifiez que les clients ont une `date_relance` définie et <= aujourd'hui
- Vérifiez qu'ils n'ont pas déjà été relancés aujourd'hui (`relance_envoyee_at`)

## 📝 Notes

- Les relances sont envoyées **une seule fois par jour** maximum par client
- Le placeholder `{{prenom}}` dans le message est remplacé par le prénom du client
- Le fuseau horaire utilisé est Europe/Paris
