// Script pour vérifier les clients éligibles aux relances
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

function getParisOffset() {
  const str = new Date().toLocaleString('en-US', {
    timeZone: 'Europe/Paris',
    timeZoneName: 'longOffset',
  });
  const match = str.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (match) {
    const sign = match[1];
    const h = match[2].padStart(2, '0');
    const m = (match[3] || '00').padStart(2, '0');
    return `${sign}${h}:${m}`;
  }
  return '+01:00';
}

async function checkRelances() {
  const todayStr = getTodayParis();
  const offset = getParisOffset().replace('GMT', '');
  const endOfTodayParis = new Date(`${todayStr}T23:59:59.999${offset}`);
  const endOfTodayUTC = endOfTodayParis.toISOString();

  console.log('📅 Date du jour (Paris):', todayStr);
  console.log('   Fin de journée (UTC):', endOfTodayUTC);
  console.log('');

  const { data: allWithDate, error } = await supabase
    .from('clients')
    .select('id, prenom, nom, telephone, date_relance, relance_envoyee_at')
    .not('date_relance', 'is', null);

  if (error) {
    console.log('❌ Erreur Supabase:', error.message);
    process.exit(1);
  }

  if (!allWithDate || allWithDate.length === 0) {
    console.log('📭 Aucun client avec une date de relance définie');
    return;
  }

  console.log(`📋 ${allWithDate.length} client(s) avec date_relance définie:\n`);

  const eligible = [];
  const filtered = [];

  for (const c of allWithDate) {
    const dateRelance = new Date(c.date_relance);
    const isPastOrToday = dateRelance <= endOfTodayParis;
    let isFiltered = false;
    let filterReason = '';

    if (c.relance_envoyee_at) {
      const sentDateStr = new Date(c.relance_envoyee_at).toLocaleDateString('en-CA', {
        timeZone: 'Europe/Paris',
      });
      if (sentDateStr === todayStr) {
        isFiltered = true;
        filterReason = `relancé aujourd'hui (${c.relance_envoyee_at})`;
      }
    }

    const wouldRelance = isPastOrToday && !isFiltered;

    console.log(`  • ${c.prenom} ${c.nom}`);
    console.log(`    Tél: ${c.telephone}`);
    console.log(`    date_relance: ${c.date_relance}`);
    console.log(`    relance_envoyee_at: ${c.relance_envoyee_at || '(jamais)'}`);
    console.log(`    Date <= aujourd'hui: ${isPastOrToday ? '✅' : '❌'}`);
    if (isFiltered) console.log(`    Exclu: ${filterReason}`);
    console.log(`    → Éligible: ${wouldRelance ? '✅ OUI' : '❌ Non'}`);
    console.log('');

    if (wouldRelance) eligible.push(c);
    if (isFiltered) filtered.push(c);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ ${eligible.length} client(s) seraient relancés par le cron`);
  if (filtered.length > 0) {
    console.log(`⏭️  ${filtered.length} exclu(s) (déjà relancés aujourd'hui)`);
  }
}

checkRelances().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
