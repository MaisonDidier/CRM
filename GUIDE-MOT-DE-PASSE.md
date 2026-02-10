# Guide : Configuration du mot de passe

## ⚠️ PROBLÈME DÉTECTÉ

Votre fichier `.env.local` contient encore la valeur par défaut :
```
CRM_PASSWORD=votre_mot_de_passe_securise
```

## ✅ SOLUTION

### Étape 1 : Ouvrir le fichier .env.local

Le fichier se trouve à la racine du projet :
```
/Users/gregoirerebbouh/Desktop/Maison Didier/.env.local
```

### Étape 2 : Modifier la ligne CRM_PASSWORD

**Trouvez cette ligne :**
```env
CRM_PASSWORD=votre_mot_de_passe_securise
```

**Remplacez-la par (exemple avec "test123") :**
```env
CRM_PASSWORD=test123
```

**⚠️ IMPORTANT :**
- ❌ PAS d'espaces : `CRM_PASSWORD = test123` (incorrect)
- ❌ PAS de guillemets : `CRM_PASSWORD="test123"` (incorrect)
- ✅ Format correct : `CRM_PASSWORD=test123` (correct)

### Étape 3 : Sauvegarder le fichier

Sauvegardez le fichier après modification.

### Étape 4 : Redémarrer le serveur

**C'EST ESSENTIEL !** Les variables d'environnement ne sont chargées qu'au démarrage.

1. Dans le terminal où tourne `npm run dev`, appuyez sur **Ctrl+C** pour arrêter
2. Relancez avec : `npm run dev`

### Étape 5 : Tester la connexion

1. Allez sur http://localhost:3000
2. Utilisez le mot de passe que vous avez mis dans `.env.local`
3. Regardez la console du serveur pour voir les logs de débogage

## 📋 Exemple complet

Votre fichier `.env.local` devrait ressembler à ça :

```env
# Copiez ce fichier en .env.local et remplissez les valeurs

# Mot de passe pour l'authentification (changez-le par un mot de passe sécurisé)
CRM_PASSWORD=test123

# URL de votre projet Supabase
NEXT_PUBLIC_SUPABASE_URL=

# Clé anonyme (anon key) de votre projet Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 🔍 Vérification

Pour vérifier que votre modification a bien été prise en compte :

1. Ouvrez le fichier `.env.local`
2. Cherchez la ligne `CRM_PASSWORD=`
3. Vérifiez que la valeur après le `=` n'est PAS `votre_mot_de_passe_securise`
4. Redémarrez le serveur
5. Essayez de vous connecter avec le nouveau mot de passe

## 🐛 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs du serveur** (le terminal où tourne `npm run dev`)
   - Vous devriez voir des messages de débogage
   - Copiez ces messages et partagez-les

2. **Vérifiez le format du fichier**
   - Pas d'espaces avant/après le `=`
   - Pas de guillemets
   - Pas de caractères invisibles

3. **Testez avec un mot de passe simple**
   - Mettez `CRM_PASSWORD=test123` dans `.env.local`
   - Redémarrez le serveur
   - Essayez de vous connecter avec `test123`





