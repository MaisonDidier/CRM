// Script pour corriger l'URL Supabase
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
let content = fs.readFileSync(envPath, 'utf8');

// Extraire l'ID du projet depuis l'URL PostgreSQL
const postgresMatch = content.match(/db\.([^.]+)\.supabase\.co/);
if (postgresMatch) {
  const projectId = postgresMatch[1];
  const correctUrl = `https://${projectId}.supabase.co`;
  
  // Remplacer l'URL PostgreSQL par l'URL API
  content = content.replace(
    /NEXT_PUBLIC_SUPABASE_URL=.*/,
    `NEXT_PUBLIC_SUPABASE_URL=${correctUrl}`
  );
  
  fs.writeFileSync(envPath, content);
  console.log('✅ URL Supabase corrigée !');
  console.log(`   Ancienne: postgresql://...`);
  console.log(`   Nouvelle: ${correctUrl}`);
} else {
  console.log('⚠️  Impossible de détecter l\'ID du projet Supabase');
}





