#!/bin/bash

# Script pour configurer le cron job des relances
# Ce script vous aide à configurer un cron job externe gratuit

echo "🔧 Configuration du cron job pour les relances automatiques"
echo ""

# Vérifier si CRON_SECRET est défini
if [ -z "$CRON_SECRET" ]; then
    echo "⚠️  CRON_SECRET n'est pas défini dans .env.local"
    echo "   Générez-le avec: openssl rand -base64 32"
    exit 1
fi

# Demander l'URL de l'application
read -p "Entrez l'URL de votre application Vercel (ex: https://votre-app.vercel.app): " APP_URL

if [ -z "$APP_URL" ]; then
    echo "❌ URL requise"
    exit 1
fi

echo ""
echo "📋 Options pour exécuter le cron job:"
echo ""
echo "1. Vercel Cron Jobs (recommandé si disponible)"
echo "   - Allez dans Vercel Dashboard → Votre projet → Settings → Cron Jobs"
echo "   - Ajoutez un nouveau cron:"
echo "     Path: /api/relances/send"
echo "     Schedule: 0 9 * * * (tous les jours à 9h)"
echo "     Headers: Authorization: Bearer $CRON_SECRET"
echo ""
echo "2. Cron-job.org (gratuit)"
echo "   - Allez sur https://cron-job.org"
echo "   - Créez un compte gratuit"
echo "   - Créez un nouveau job:"
echo "     URL: $APP_URL/api/relances/send"
echo "     Method: POST"
echo "     Headers: Authorization: Bearer $CRON_SECRET"
echo "     Schedule: Tous les jours à 9h"
echo ""
echo "3. EasyCron (gratuit jusqu'à 1 job)"
echo "   - Allez sur https://www.easycron.com"
echo "   - Créez un compte gratuit"
echo "   - Configurez comme cron-job.org"
echo ""
echo "4. GitHub Actions (gratuit)"
echo "   - Créez .github/workflows/relances.yml"
echo "   - Voir le fichier d'exemple dans le projet"
echo ""
echo "✅ Configuration terminée!"
echo ""
echo "Pour tester manuellement:"
echo "curl -X POST $APP_URL/api/relances/send \\"
echo "  -H 'Authorization: Bearer $CRON_SECRET'"





