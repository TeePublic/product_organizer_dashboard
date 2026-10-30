import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'pod_session'
export const OAUTH_COOKIE = 'pod_oauth'

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET)

export const authConfigured = () => Boolean(process.env.AUTH_OKTA_ID)

export function signToken(claims, seconds) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${seconds}s`)
    .sign(secret())
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] })
    return payload
  } catch {
    return null
  }
}

export function getCookie(header, name) {
  for (const part of (header || '').split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return v.join('=')
  }
  return null
}

export function setCookie(name, value, seconds) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${seconds}`
}

export async function discover() {
  const base = process.env.AUTH_OKTA_ISSUER.replace(/\/$/, '')
  const res = await fetch(`${base}/.well-known/openid-configuration`)
  if (!res.ok) throw new Error(`Okta discovery failed: ${res.status}`)
  return res.json()
}

// Only allow same-site relative paths after login
export function safeNext(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}