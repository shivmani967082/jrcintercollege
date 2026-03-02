/**
 * Simple JWT-like token for student auth (using crypto only)
 */

const crypto = require('crypto');

const SECRET = process.env.STUDENT_JWT_SECRET || process.env.JWT_SECRET || 'jrc-student-secret-change-in-production';
const TOKEN_VALIDITY_DAYS = 30;

function sign(payload) {
  const expires = Date.now() + TOKEN_VALIDITY_DAYS * 24 * 60 * 60 * 1000;
  const data = JSON.stringify({ ...payload, exp: expires });
  const encoded = Buffer.from(data).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  const expectedSig = crypto.createHmac('sha256', SECRET).update(encoded).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const data = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    if (data.exp && Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

module.exports = { sign, verify };
