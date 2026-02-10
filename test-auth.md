# Test de l'authentification

## Instructions pour déboguer

1. **Vérifiez le fichier .env.local**
   - Ouvrez le fichier `.env.local` à la racine du projet
   - La ligne doit être exactement : `CRM_PASSWORD=votre_mot_de_passe` (sans espaces, sans guillemets)
   - Remplacez `votre_mot_de_passe` par votre vrai mot de passe

2. **Redémarrez le serveur**
   - Arrêtez le serveur (Ctrl+C)
   - Relancez avec `npm run dev`

3. **Essayez de vous connecter**
   - Regardez la console du serveur (le terminal où tourne `npm run dev`)
   - Vous devriez voir des logs de débogage qui affichent :
     - La longueur du mot de passe reçu
     - La longueur du mot de passe attendu
     - Si ils correspondent

4. **Vérifiez les logs**
   - Les logs apparaîtront dans le terminal du serveur
   - Copiez les logs et partagez-les pour qu'on puisse diagnostiquer

## Format correct du fichier .env.local

```env
CRM_PASSWORD=monMotDePasse123
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

**Important :**
- Pas d'espaces avant ou après le `=`
- Pas de guillemets
- Pas de ligne vide avant CRM_PASSWORD
- Le mot de passe est sensible à la casse





