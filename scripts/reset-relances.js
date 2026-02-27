#!/usr/bin/env node
/**
 * Reset TOUS les clients pour retester les relances SMS.
 * Remet relance_envoyee_at à NULL et date_relance à aujourd'hui.
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

async function resetClients() {
  const todayStr = getTodayParis();
  const dateRelance = new Date(`${todayStr}T12:00:00`).toISOString();

  console.log('🔄 Reset des relances pour tous les clients...\n');

  const { data: allClients, error: fetchError } = await supabase
    .from('clients')
    .select('id');

  if (fetchError || !allClients?.length) {
    console.log('⚠️  Aucun client trouvé.');
    process.exit(0);
  }

  const ids = allClients.map((c) => c.id);
  const { data: updated, error } = await supabase
    .from('clients')
    .update({
      relance_envoyee_at: null,
      date_relance: dateRelance,
    })
    .in('id', ids)
    .select('id, prenom, nom, telephone, date_relance, relance_envoyee_at');

  if (error) {
    console.error('❌ Erreur Supabase:', error.message);
    process.exit(1);
  }

  if (!updated || updated.length === 0) {
    console.log('⚠️  Aucun client trouvé.');
    process.exit(0);
  }

  console.log(`✅ ${updated.length} client(s) réinitialisé(s) :\n`);
  updated.forEach((c) => {
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
