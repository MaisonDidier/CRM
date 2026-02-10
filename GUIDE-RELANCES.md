# Guide d'installation des relances automatiques

Ce guide vous explique comment configurer les relances automatiques pour votre CRM au coût le plus faible possible.

## 🎯 Options disponibles

### Option 1: Email (GRATUIT - Recommandé) ⭐
- **Coût**: Gratuit jusqu'à 3000 emails/mois
- **Service**: Resend
- **Avantages**: Gratuit, fiable, facile à configurer
- **Inconvénient**: Le client doit avoir un email (ou vous recevez une notification)

### Option 2: SMS (PAYANT)
- **Coût**: ~0.05€ par SMS en France
- **Service**: Twilio
- **Avantages**: Direct, le client reçoit le SMS
- **Inconvénient**: Coût par SMS

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
3. Ajoutez-le dans `.env.local` comme `CRON_SECRET`

### Étape 3A: Configuration Email (GRATUIT - Recommandé)

1. **Créer un compte Resend** (gratuit)
   - Allez sur https://resend.com/signup
   - Créez un compte gratuit (3000 emails/mois)

2. **Obtenir votre clé API**
   - Dans le dashboard Resend, allez dans "API Keys"
   - Créez une nouvelle clé API
   - Copiez-la dans `.env.local` comme `RESEND_API_KEY`

3. **Vérifier votre domaine** (optionnel mais recommandé)
   - Dans Resend, allez dans "Domains"
   - Ajoutez votre domaine et suivez les instructions DNS
   - Utilisez ce domaine dans `EMAIL_FROM`

4. **Activer les emails dans `.env.local`** :
   ```
   ENABLE_EMAIL_RELANCE=true
   RESEND_API_KEY=re_votre_cle_ici
   EMAIL_FROM=relances@votredomaine.com
   EMAIL_TO=contact@votredomaine.com
   ```

### Étape 3B: Configuration SMS (PAYANT - Optionnel)

Si vous préférez envoyer des SMS directement aux clients :

1. **Créer un compte Twilio**
   - Allez sur https://www.twilio.com
   - Créez un compte (crédit de départ offert)

2. **Obtenir vos identifiants**
   - Account SID et Auth Token dans le dashboard
   - Achetez un numéro de téléphone français

3. **Configurer dans `.env.local`** :
   ```
   ENABLE_SMS_RELANCE=true
   TWILIO_ACCOUNT_SID=votre_account_sid
   TWILIO_AUTH_TOKEN=votre_auth_token
   TWILIO_PHONE_NUMBER=+33612345678
   ```

### Étape 4: Configurer le cron job (exécution automatique)

Vous avez plusieurs options gratuites pour exécuter les relances automatiquement :

#### Option A: Vercel Cron Jobs (si disponible)

1. Dans Vercel Dashboard → Votre projet → Settings → Cron Jobs
2. Cliquez sur "Add Cron Job"
3. Configurez :
   - **Path**: `/api/relances/send`
   - **Schedule**: `0 9 * * *` (tous les jours à 9h UTC)
   - **Headers**: `Authorization: Bearer VOTRE_CRON_SECRET`

#### Option B: Cron-job.org (GRATUIT - Recommandé) ⭐

1. Allez sur https://cron-job.org
2. Créez un compte gratuit
3. Créez un nouveau job :
   - **URL**: `https://votre-app.vercel.app/api/relances/send`
   - **Method**: POST
   - **Headers**: `Authorization: Bearer VOTRE_CRON_SECRET`
   - **Schedule**: Tous les jours à 9h (ou l'heure de votre choix)

#### Option C: GitHub Actions (GRATUIT)

1. Dans votre repo GitHub, allez dans Settings → Secrets and variables → Actions
2. Ajoutez ces secrets :
   - `APP_URL`: L'URL de votre app Vercel
   - `CRON_SECRET`: Votre secret généré
3. Le workflow est déjà configuré dans `.github/workflows/relances.yml`
4. Il s'exécutera automatiquement tous les jours

#### Option D: EasyCron (GRATUIT jusqu'à 1 job)

1. Allez sur https://www.easycron.com
2. Créez un compte gratuit
3. Configurez comme cron-job.org

### Étape 5: Déployer sur Vercel

1. **Ajouter les variables d'environnement dans Vercel**
   - Allez dans votre projet Vercel
   - Settings → Environment Variables
   - Ajoutez toutes les variables de `.env.local`

2. **Déployer**
   ```bash
   git add .
   git commit -m "Ajout des relances automatiques"
   git push
   ```

### Étape 5: Tester manuellement

Vous pouvez tester l'envoi des relances manuellement :

1. **Via l'interface** (nécessite d'être connecté)
   - Allez sur `/api/relances/send` (GET)
   - Vous verrez la liste des clients à relancer

2. **Via curl** (pour tester le cron job)
   ```bash
   curl -X POST https://votre-domaine.vercel.app/api/relances/send \
     -H "Authorization: Bearer VOTRE_CRON_SECRET"
   ```

## 🔄 Comment ça fonctionne

1. **Tous les jours à 9h**, le cron job Vercel appelle `/api/relances/send`
2. Le système récupère tous les clients dont `date_relance <= aujourd'hui`
3. Pour chaque client :
   - Si email activé : envoie une notification email
   - Si SMS activé : envoie un SMS au client
4. Marque la relance comme envoyée pour éviter les doublons

## 💡 Recommandation

**Pour un coût minimal**, utilisez uniquement l'option Email :
- Gratuit jusqu'à 3000 emails/mois
- Vous recevez une notification avec le message à envoyer
- Vous pouvez ensuite appeler ou envoyer un SMS manuellement au client

## 📊 Coûts estimés

- **Email uniquement**: 0€/mois (gratuit jusqu'à 3000 emails)
- **SMS uniquement**: ~0.05€ par SMS × nombre de clients à relancer
- **Email + SMS**: Email gratuit + coût SMS

## 🛠️ Dépannage

### Le cron job ne s'exécute pas
- Vérifiez que `CRON_SECRET` est bien configuré dans Vercel
- Vérifiez les logs dans Vercel → Deployments → Functions

### Les emails ne partent pas
- Vérifiez que `RESEND_API_KEY` est correct
- Vérifiez que `EMAIL_FROM` est un domaine vérifié dans Resend
- Consultez les logs Resend dans le dashboard

### Les SMS ne partent pas
- Vérifiez que votre compte Twilio a des crédits
- Vérifiez que le numéro de téléphone est au format international (+33...)
- Consultez les logs Twilio dans le dashboard

## 📝 Notes importantes

- Les relances sont envoyées **une seule fois par jour** maximum
- Si un client a plusieurs relances à faire, seule la première sera envoyée
- Le système évite les doublons en marquant les relances comme envoyées
- Vous pouvez toujours envoyer manuellement via l'interface

