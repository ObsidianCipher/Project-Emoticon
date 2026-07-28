const EMTCN_PREFIX  = 'EMTCN';
const SEGMENT_COUNT  = 3;
const SEGMENT_LENGTH = 4;
const CHARSET        = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function getSecureRandomBytes(count) {
  /* Node.js crypto (server-side) */
  if (typeof require === 'function') {
    try {
      return require('crypto').randomBytes(count);
    } catch (_) { /* fall through */ }
  }
  /* Browser WebCrypto (client-side, not used in Node) */
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buffer = new Uint8Array(count);
    crypto.getRandomValues(buffer);
    return buffer;
  }
  /* Last-resort insecure fallback */
  const buffer = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }
  return buffer;
}

function generateEmtcnKey() {
  const totalChars  = SEGMENT_COUNT * SEGMENT_LENGTH;
  const randomBytes = getSecureRandomBytes(totalChars);
  const segments    = [];

  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const start = i * SEGMENT_LENGTH;
    let segment = '';
    for (let j = 0; j < SEGMENT_LENGTH; j++) {
      segment += CHARSET[randomBytes[start + j] % CHARSET.length];
    }
    segments.push(segment);
  }

  return `${EMTCN_PREFIX}-${segments.join('-')}`;
}

async function generateUniqueEmtcnKey(existsFn, maxAttempts = 20) {
  if (typeof existsFn !== 'function') {
    throw new TypeError('existsFn must be a function returning a boolean or Promise<boolean>');
  }
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const key    = generateEmtcnKey();
    const exists = await Promise.resolve(existsFn(key));
    if (!exists) return key;
  }
  throw new Error(`Unable to generate a unique EMTCN key after ${maxAttempts} attempts.`);
}

function isValidEmtcnKey(key) {
  return /^EMTCN-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key);
}

function normalizeEmtcnKey(key) {
  return String(key).trim().toUpperCase();
}

module.exports = {
  generateEmtcnKey,
  generateUniqueEmtcnKey,
  isValidEmtcnKey,
  normalizeEmtcnKey,
};