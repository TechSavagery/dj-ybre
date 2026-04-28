import crypto from 'crypto'
import { NextRequest } from 'next/server'

const UNLOCK_COOKIE_NAME = 'event_portal_unlock'

function base64UrlEncode(input: Buffer | string) {
  const buffer = typeof input === 'string' ? Buffer.from(input, 'utf8') : input
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  return Buffer.from(padded, 'base64')
}

function getUnlockSecret() {
  const secret =
    process.env.EVENT_PORTAL_UNLOCK_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.JWT_SECRET ||
    process.env.DATABASE_URL ||
    ''
  if (!secret) {
    throw new Error('Missing EVENT_PORTAL_UNLOCK_SECRET (or NEXTAUTH_SECRET).')
  }
  return secret
}

function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

export function normalizePortalPin(pin: unknown) {
  const raw = typeof pin === 'string' ? pin : typeof pin === 'number' ? String(pin) : ''
  const digitsOnly = raw.replace(/\D+/g, '')
  return digitsOnly
}

export function isValidPortalPin(pin: string) {
  return /^\d{4,6}$/.test(pin)
}

export function hashPortalPin(pin: string) {
  const salt = crypto.randomBytes(16)
  const derived = crypto.scryptSync(pin, salt, 32)
  return `${base64UrlEncode(salt)}.${base64UrlEncode(derived)}`
}

export function verifyPortalPin(pin: string, stored: string) {
  const [saltB64, hashB64] = String(stored || '').split('.')
  if (!saltB64 || !hashB64) return false
  const salt = base64UrlDecode(saltB64)
  const derived = crypto.scryptSync(pin, salt, 32)
  const derivedB64 = base64UrlEncode(derived)
  return timingSafeEqual(derivedB64, hashB64)
}

export function createPortalUnlockCookieValue(input: { accessCode: string; ttlSeconds?: number }) {
  const secret = getUnlockSecret()
  const ttlSeconds = Number.isFinite(input.ttlSeconds) ? Number(input.ttlSeconds) : 60 * 60 * 24 * 14
  const payload = {
    accessCode: input.accessCode,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  }
  const payloadB64 = base64UrlEncode(JSON.stringify(payload))
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64')
  const signatureB64 = signature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  return `${payloadB64}.${signatureB64}`
}

export function hasValidPortalUnlock(request: NextRequest, accessCode: string) {
  const value = request.cookies.get(UNLOCK_COOKIE_NAME)?.value
  if (!value) return false
  const [payloadB64, sigB64] = value.split('.')
  if (!payloadB64 || !sigB64) return false

  const secret = getUnlockSecret()
  const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64')
  const expectedSigB64 = expectedSig.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  if (!timingSafeEqual(expectedSigB64, sigB64)) return false

  let payload: any
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf8'))
  } catch {
    return false
  }

  if (!payload || typeof payload !== 'object') return false
  if (payload.accessCode !== accessCode) return false
  if (typeof payload.exp !== 'number') return false
  if (payload.exp < Math.floor(Date.now() / 1000)) return false
  return true
}

export function getPortalUnlockCookieName() {
  return UNLOCK_COOKIE_NAME
}

