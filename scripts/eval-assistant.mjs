import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '..');
const envPath = path.join(rootDir, 'apps', 'mobile', '.env');
const csvPath = path.join(rootDir, 'evals', 'eval-assistant.csv');

function loadEnv(filePath) {
  const vars = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

function parseCsvLine(line) {
  const cols = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cols.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  cols.push(cur.trim());
  return cols;
}

const env = loadEnv(envPath);
const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: anonKey, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: process.argv[2] || 'admin@tf.com', password: process.argv[3] || 'admin' }),
});
const authData = await authRes.json();
if (!authRes.ok || !authData.access_token) {
  console.error('Auth failed:', authData);
  process.exit(1);
}

const lines = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/).filter((l) => l.trim());
const rows = lines.slice(1).map(parseCsvLine);

let totalMs = 0;
let inventions = 0;
const results = [];

for (let i = 0; i < rows.length; i += 1) {
  const [question, expected, expectedSource] = rows[i];
  const t0 = performance.now();
  const res = await fetch(`${supabaseUrl}/functions/v1/project-assistant`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${authData.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'ask', question }),
  });
  const elapsed = Math.round(performance.now() - t0);
  totalMs += elapsed;
  const body = await res.json();
  const answer = body.answer || body.code || 'ERREUR';
  const sources = Array.isArray(body.citations) && body.citations.length > 0
    ? body.citations.map((c) => c.document).join(', ')
    : 'aucune';
  const isUnknown = answer.toLowerCase().includes('je ne sais pas');
  const isInvention = !isUnknown && sources === 'aucune';
  if (isInvention) inventions += 1;

  const expectedUnknownOrRefusal = expected === 'Je ne sais pas' || expected === 'Refus';
  const ok = expectedUnknownOrRefusal ? isUnknown : (!isUnknown && sources !== 'aucune');

  results.push({ num: i + 1, question, answer: answer.slice(0, 90), sources, ok, elapsed });
}

console.log(JSON.stringify({
  total: results.length,
  passed: results.filter((r) => r.ok).length,
  inventions,
  avgMs: Math.round(totalMs / results.length),
  results,
}, null, 2));
