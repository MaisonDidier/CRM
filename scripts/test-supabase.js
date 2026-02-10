// Script pour tester la connexion Supabase
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Lire .env.local manuellement
const envContent = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = null;
let supabaseKey = null;

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = trimmed.split('=')[1];
  } else if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseKey = trimmed.split('=')[1];
  }
});

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase non configuré');
  process.exit(1);
}

console.log('🔗 Test de connexion à Supabase...\n');
console.log('URL:', supabaseUrl);
console.log('Clé (premiers 20 caractères):', supabaseKey.substring(0, 20) + '...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

// Tester la connexion en listant les tables
async function testConnection() {
  try {
    // Essayer de récupérer les clients (la table doit exister)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('⚠️  La table "clients" n\'existe pas encore');
        console.log('   → Créez-la dans Supabase avec le script SQL (voir GUIDE-SUPABASE.md)');
        return false;
      } else {
        console.log('❌ Erreur de connexion:', error.message);
        return false;
      }
    }

    console.log('✅ Connexion Supabase réussie !');
    console.log('✅ La table "clients" existe');
    console.log('   Nombre de clients:', data ? data.length : 0);
    return true;
  } catch (err) {
    console.log('❌ Erreur:', err.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Tout est fonctionnel !');
  } else {
    console.log('\n📝 Actions à faire:');
    console.log('   1. Créez la table "clients" dans Supabase');
    console.log('   2. Utilisez le script SQL dans supabase-schema.sql');
  }
  process.exit(success ? 0 : 1);
});

