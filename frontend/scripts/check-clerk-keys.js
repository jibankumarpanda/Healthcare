const fs = require('fs');
const path = require('path');

function parseEnv(content) {
  const lines = content.split(/\r?\n/);
  const out = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    const v = trimmed.slice(eq + 1).trim();
    out[k] = v;
  }
  return out;
}

function readEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return parseEnv(content);
  } catch (err) {
    return {};
  }
}

const frontendEnvPath = path.join(__dirname, '..', '.env.local');
const backendEnvPath = path.join(__dirname, '..', '..', 'backend', '.env');

const frontendEnv = readEnvFile(frontendEnvPath);
const backendEnv = readEnvFile(backendEnvPath);

const fPub = frontendEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || null;
const bPub = backendEnv.CLERK_PUBLISHABLE_KEY || null;
const bSecret = backendEnv.CLERK_SECRET_KEY || null;

function mask(s) {
  if (!s) return '<missing>';
  if (s.length < 12) return s.replace(/.(?=.{4})/g, '*');
  return s.slice(0, 8) + '...' + s.slice(-4);
}

console.log('Frontend publishable key:', fPub ? mask(fPub) : '<missing>');
console.log('Backend publishable key :', bPub ? mask(bPub) : '<missing>');
console.log('Backend secret key      :', bSecret ? '<set>' : '<missing>');

if (!fPub) {
  console.warn('WARN: Frontend NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing in frontend/.env.local');
}
if (!bPub) {
  console.warn('WARN: Backend CLERK_PUBLISHABLE_KEY is missing in backend/.env');
}
if (!bSecret) {
  console.warn('WARN: Backend CLERK_SECRET_KEY is missing in backend/.env');
}

if (fPub && bPub && fPub !== bPub) {
  console.error('Mismatch detected: frontend and backend publishable keys differ.');
  process.exitCode = 2;
} else if (!fPub || !bPub || !bSecret) {
  console.error('Missing keys detected. Please set the missing values and try again.');
  process.exitCode = 3;
} else {
  console.log('OK: Frontend and backend publishable keys match and secret is present.');
  process.exitCode = 0;
}

if (require.main === module) process.exit(process.exitCode);
