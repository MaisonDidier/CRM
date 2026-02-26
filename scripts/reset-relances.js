#!/usr/bin/env node
/**
 * Reset les clients pour retester les relances SMS.
 * Remet relance_envoyee_at à NULL et date_relance à aujourd'hui pour les 2 clients de test.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local introuvable');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
let supabaseUrl = null;
let supabaseKey = null;
envContent.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = trimmed.split('=')[1]?.trim();
  } else if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseKey = trimmed.split('=')[1]?.trim();
  }
});

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase non configuré');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function getTodayParis() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
}

const CLIENTS_TO_RESET = [
  { prenom: 'Grégoire', nom: 'Rebbouh' },
  { prenom: 'Gregoire', nom: 'Rebbouh' },  // fallback sans accent
  { prenom: 'Jean', nom: 'Fabre' },
];

async function resetClients() {
  const todayStr = getTodayParis();
  const dateRelance = new Date(`${todayStr}T12:00:00`).toISOString();

  console.log('🔄 Reset des relances pour les 2 clients...\n');

  const updated = [];

  for (const { prenom, nom } of CLIENTS_TO_RESET) {
    const { data, error } = await supabase
      .from('clients')
      .update({
        relance_envoyee_at: null,
        date_relance: dateRelance,
      })
      .eq('prenom', prenom)
      .eq('nom', nom)
      .select('id, prenom, nom, telephone, date_relance, relance_envoyee_at');

    if (error) {
      console.error(`❌ Erreur pour ${prenom} ${nom}:`, error.message);
      continue;
    }
    if (data && data.length > 0) {
      updated.push(...data);
    }
  }

  // Éviter les doublons (Grégoire/Gregoire)
  const unique = updated.filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i);

  if (unique.length === 0) {
    console.log('⚠️  Aucun client trouvé. Vérifiez les noms dans Supabase.');
    process.exit(0);
  }

  console.log(`✅ ${unique.length} client(s) réinitialisé(s) :\n`);
  unique.forEach((c) => {
    console.log(`   • ${c.prenom} ${c.nom} (${c.telephone})`);
    console.log(`     date_relance: ${c.date_relance}`);
    console.log(`     relance_envoyee_at: ${c.relance_envoyee_at || 'null'}\n`);
  });
  console.log('Vous pouvez retester avec :');
  console.log('  curl -X POST "https://crm-sable-two.vercel.app/api/relances/send" \\');
  console.log('    -H "Authorization: Bearer VOTRE_CRON_SECRET" -H "x-debug: 1"');
}

resetClients().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
