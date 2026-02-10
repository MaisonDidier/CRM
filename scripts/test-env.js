// Script pour tester la configuration des variables d'environnement
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Vérification des variables d\'environnement:\n');

const crmPassword = process.env.CRM_PASSWORD;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('CRM_PASSWORD:');
if (crmPassword) {
  console.log('  ✅ Défini');
  console.log('  Longueur:', crmPassword.length, 'caractères');
  console.log('  Valeur (premiers 3 caractères):', crmPassword.substring(0, 3) + '...');
  console.log('  Valeur complète:', crmPassword);
} else {
  console.log('  ❌ NON DÉFINI');
}

console.log('\nNEXT_PUBLIC_SUPABASE_URL:');
if (supabaseUrl) {
  console.log('  ✅ Défini:', supabaseUrl);
} else {
  console.log('  ⚠️  Non défini (optionnel pour l\'authentification)');
}

console.log('\nNEXT_PUBLIC_SUPABASE_ANON_KEY:');
if (supabaseKey) {
  console.log('  ✅ Défini (longueur:', supabaseKey.length, 'caractères)');
} else {
  console.log('  ⚠️  Non défini (optionnel pour l\'authentification)');
}

console.log('\n📝 Instructions:');
if (!crmPassword || crmPassword === 'votre_mot_de_passe_securise') {
  console.log('  ❌ Le mot de passe n\'est pas configuré ou utilise la valeur par défaut');
  console.log('  → Modifiez le fichier .env.local et remplacez:');
  console.log('     CRM_PASSWORD=votre_mot_de_passe_securise');
  console.log('     par:');
  console.log('     CRM_PASSWORD=votre_vrai_mot_de_passe');
} else {
  console.log('  ✅ Le mot de passe est configuré');
  console.log('  → Utilisez ce mot de passe pour vous connecter:');
  console.log('     "' + crmPassword + '"');
}





