# ✅ Checklist de Production - Maison Didier CRM

## 🔒 Sécurité - AVANT LE DÉPLOIEMENT

### Variables d'Environnement (Vercel)

Ajoutez ces variables dans Vercel → Settings → Environment Variables :

- [ ] `CRM_PASSWORD` - Mot de passe fort (minimum 12 caractères)
- [ ] `SESSION_SECRET` - Généré avec `openssl rand -base64 32` (⚠️ PAS "authenticated")
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - URL de votre projet Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clé anonyme Supabase
- [ ] `CRON_SECRET` - Généré avec `openssl rand -base64 32` (si relances activées)
- [ ] `BREVO_API_KEY` - Clé API Brevo (pour les relances SMS)

### Génération des Secrets

```bash
# Générer SESSION_SECRET
openssl rand -base64 32

# Générer CRON_SECRET
openssl rand -base64 32
```

## 📋 Vérifications Techniques

- [ ] Build réussi : `npm run build`
- [ ] Pas d'erreurs TypeScript : `npx tsc --noEmit`
- [ ] Pas d'erreurs ESLint : `npm run lint`
- [ ] `.env.local` est dans `.gitignore` (vérifié)
- [ ] Aucun secret commité dans Git
- [ ] `NODE_ENV=production` en production

## 🗄️ Base de Données

- [ ] Table `clients` créée dans Supabase
- [ ] Colonne `relance_envoyee_at` ajoutée (si relances activées)
- [ ] Index créés pour les performances
- [ ] RLS (Row Level Security) configuré si nécessaire

## 🔐 Configuration Supabase

- [ ] URL Supabase correcte (format : `https://xxx.supabase.co`)
- [ ] Clé anonyme (anon key) correcte
- [ ] Politique de sécurité configurée
- [ ] Backup activé

## 🚀 Déploiement Vercel

- [ ] Projet connecté à Vercel
- [ ] Variables d'environnement configurées
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] HTTPS activé (automatique avec Vercel)
- [ ] Build réussi sur Vercel

## 📧 Relances Automatiques (Optionnel)

Si vous activez les relances SMS :

- [ ] Compte Brevo créé (https://www.brevo.com)
- [ ] Clé API Brevo configurée
- [ ] Cron job configuré (Vercel ou cron-job.org)
- [ ] `CRON_SECRET` défini et testé

## 🧪 Tests de Sécurité

- [ ] Tentative de connexion avec mauvais mot de passe → Échec
- [ ] Accès à `/api/clients` sans auth → 401
- [ ] Injection XSS dans formulaire → Bloqué
- [ ] Validation des limites de champs → Fonctionne
- [ ] Headers de sécurité présents → Vérifiés

## 📊 Monitoring

- [ ] Logs Vercel activés
- [ ] Alertes configurées (optionnel)
- [ ] Monitoring des erreurs (optionnel)

## ✅ Post-Déploiement

- [ ] Test de connexion fonctionne
- [ ] Création de client fonctionne
- [ ] Modification de client fonctionne
- [ ] Suppression de client fonctionne
- [ ] Planification de relance fonctionne
- [ ] Interface responsive testée

## 📝 Documentation

- [ ] `SECURITE.md` lu et compris
- [ ] `GUIDE-RELANCES.md` lu (si relances activées)
- [ ] Mot de passe partagé de manière sécurisée
- [ ] Accès administrateur limité

---

**⚠️ IMPORTANT** : Ne déployez JAMAIS avec `SESSION_SECRET=authenticated` en production !

**✅ Prêt pour la production** : Cochez toutes les cases ci-dessus avant de déployer.





