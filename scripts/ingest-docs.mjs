import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '..');
const envPath = path.join(rootDir, 'apps', 'mobile', '.env');
const docsDir = path.join(rootDir, 'docs-app');

function loadEnv(filePath) {
  const vars = {};
  if (!fs.existsSync(filePath)) return vars;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

const env = loadEnv(envPath);
const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.ADMIN_EMAIL || process.argv[2];
const password = process.env.ADMIN_PASSWORD || process.argv[3];

if (!supabaseUrl || !anonKey) {
  console.error('EXPO_PUBLIC_SUPABASE_URL ou EXPO_PUBLIC_SUPABASE_ANON_KEY manquant dans apps/mobile/.env');
  process.exit(1);
}
if (!email || !password) {
  console.error('Usage: node scripts/ingest-docs.mjs <admin-email> <admin-password>');
  process.exit(1);
}

const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: anonKey, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const authData = await authRes.json();
if (!authRes.ok || !authData.access_token) {
  console.error('Connexion administrateur impossible:', authData);
  process.exit(1);
}

const files = fs.readdirSync(docsDir).filter((f) => f.endsWith('.md') && f !== 'README.md').sort();
for (const filename of files) {
  const content = fs.readFileSync(path.join(docsDir, filename), 'utf8').trim();
  const firstHeading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const title = firstHeading || filename.replace(/\.md$/, '');

  const res = await fetch(`${supabaseUrl}/functions/v1/project-assistant`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${authData.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'ingest', title, filename, content }),
  });
  const body = await res.json();
  if (!res.ok) {
    console.error(`Erreur pour ${filename}:`, res.status, body);
  } else {
    console.log(`Importé : ${filename} (${body.passages} passages)`);
  }
}
