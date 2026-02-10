// Script de test de configuration
const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la configuration...\n');

// Vérifier .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ Le fichier .env.local n\'existe pas');
  process.exit(1);
}

console.log('✅ Fichier .env.local trouvé\n');

// Lire et analyser .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

let crmPassword = null;
let supabaseUrl = null;
let supabaseKey = null;

lines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed.startsWith('CRM_PASSWORD=')) {
    crmPassword = trimmed.split('=')[1];
  } else if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = trimmed.split('=')[1];
  } else if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseKey = trimmed.split('=')[1];
  }
});

// Vérifier CRM_PASSWORD
console.log('📝 CRM_PASSWORD:');
if (!crmPassword || crmPassword === 'votre_mot_de_passe_securise') {
  console.log('  ❌ Non configuré ou valeur par défaut');
} else {
  console.log('  ✅ Configuré (longueur: ' + crmPassword.length + ' caractères)');
}

// Vérifier Supabase
console.log('\n🗄️  Supabase:');
if (!supabaseUrl || supabaseUrl === 'https://votre-projet.supabase.co' || supabaseUrl === '') {
  console.log('  ❌ NEXT_PUBLIC_SUPABASE_URL non configuré');
} else {
  console.log('  ✅ NEXT_PUBLIC_SUPABASE_URL configuré');
  console.log('     URL: ' + supabaseUrl);
}

if (!supabaseKey || supabaseKey === 'votre_cle_anon_supabase' || supabaseKey === '') {
  console.log('  ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY non configuré');
} else {
  console.log('  ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY configuré');
  console.log('     Longueur: ' + supabaseKey.length + ' caractères');
}

// Résumé
console.log('\n📊 Résumé:');
const allConfigured = crmPassword && 
                     crmPassword !== 'votre_mot_de_passe_securise' &&
                     supabaseUrl && 
                     supabaseUrl !== 'https://votre-projet.supabase.co' &&
                     supabaseUrl !== '' &&
                     supabaseKey && 
                     supabaseKey !== 'votre_cle_anon_supabase' &&
                     supabaseKey !== '';

if (allConfigured) {
  console.log('✅ Toutes les configurations sont en place !');
  console.log('\n💡 Prochaines étapes:');
  console.log('   1. Créer la table "clients" dans Supabase (voir GUIDE-SUPABASE.md)');
  console.log('   2. Redémarrer le serveur: npm run dev');
  console.log('   3. Tester la connexion avec le mot de passe configuré');
} else {
  console.log('⚠️  Certaines configurations manquent');
  if (!crmPassword || crmPassword === 'votre_mot_de_passe_securise') {
    console.log('   - Configurez CRM_PASSWORD dans .env.local');
  }
  if (!supabaseUrl || supabaseUrl === 'https://votre-projet.supabase.co' || supabaseUrl === '') {
    console.log('   - Configurez NEXT_PUBLIC_SUPABASE_URL dans .env.local');
  }
  if (!supabaseKey || supabaseKey === 'votre_cle_anon_supabase' || supabaseKey === '') {
    console.log('   - Configurez NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local');
  }
}





