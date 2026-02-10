# Dépannage - Problème de mot de passe

## Le mot de passe ne fonctionne pas

### 1. Vérifier le fichier .env.local

Assurez-vous que le fichier `.env.local` existe à la racine du projet et contient :

```env
CRM_PASSWORD=votre_vrai_mot_de_passe
```

**Points importants :**
- ❌ Pas d'espaces avant ou après le `=`
- ❌ Pas de guillemets autour de la valeur
- ✅ Le mot de passe est sensible à la casse (majuscules/minuscules)
- ✅ Les espaces dans le mot de passe sont pris en compte

**Exemples :**
```env
# ✅ Correct
CRM_PASSWORD=monMotDePasse123

# ❌ Incorrect (espaces)
CRM_PASSWORD = monMotDePasse123

# ❌ Incorrect (guillemets)
CRM_PASSWORD="monMotDePasse123"
```

### 2. Redémarrer le serveur

**IMPORTANT** : Après avoir modifié `.env.local`, vous DEVEZ redémarrer le serveur Next.js :

1. Arrêtez le serveur (Ctrl+C dans le terminal)
2. Redémarrez avec `npm run dev`

Les variables d'environnement ne sont chargées qu'au démarrage du serveur.

### 3. Vérifier que le mot de passe est exactement le même

Le mot de passe est comparé de manière stricte :
- Les majuscules/minuscules comptent : `MotDePasse` ≠ `motdepasse`
- Les espaces comptent : `mot de passe` ≠ `motdepasse`
- Les caractères spéciaux comptent : `mot@pass` ≠ `motpass`

### 4. Vérifier les logs du serveur

Si vous voyez une erreur dans la console du serveur comme :
```
CRM_PASSWORD n'est pas configuré dans les variables d'environnement
```

Cela signifie que Next.js ne trouve pas la variable. Vérifiez :
- Le fichier s'appelle bien `.env.local` (avec le point au début)
- Le fichier est à la racine du projet (même niveau que `package.json`)
- Vous avez redémarré le serveur après modification

### 5. Test rapide

Pour tester si la variable est bien chargée, vous pouvez temporairement ajouter dans `lib/auth.ts` :

```typescript
console.log("CRM_PASSWORD configuré:", !!process.env.CRM_PASSWORD);
```

Puis regardez les logs du serveur au démarrage.

### 6. Solution de contournement temporaire

Si vous voulez tester rapidement, vous pouvez temporairement définir le mot de passe directement dans le code (⚠️ **UNIQUEMENT pour le développement local, JAMAIS en production**) :

Dans `lib/auth.ts`, remplacez :
```typescript
const correctPassword = process.env.CRM_PASSWORD;
```

Par :
```typescript
const correctPassword = process.env.CRM_PASSWORD || "motdepasse_test";
```

**N'oubliez pas de remettre le code original après !**

## Vérification rapide

1. ✅ Le fichier `.env.local` existe
2. ✅ La ligne `CRM_PASSWORD=votre_mot_de_passe` est présente (sans espaces)
3. ✅ Le serveur a été redémarré après modification
4. ✅ Le mot de passe saisi correspond exactement (casse, espaces)

Si tout cela est correct et que ça ne fonctionne toujours pas, vérifiez la console du navigateur (F12) pour voir les erreurs éventuelles.





