import { randomBytes, createHash } from 'node:crypto'
import { signToken, setCookie, discover, safeNext, OAUTH_COOKIE } from '../../lib/auth.js'

const b64url = (buf) => buf.toString('base64url')

export default async function handler(req, res) {
  try {
    const config = await discover()
    const state = b64url(randomBytes(16))
    const nonce = b64url(randomBytes(16))
    const verifier = b64url(randomBytes(32))
    const challenge = b64url(createHash('sha256').update(verifier).digest())

    const ticket = await signToken(
      { state, nonce, verifier, next: safeNext(req.query.next) },
      600
    )
    const redirectUri = `https://${req.headers.host}/api/auth/callback/okta`

    const url = new URL(config.authorization_endpoint)
    url.search = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.AUTH_OKTA_ID,
      redirect_uri: redirectUri,
      scope: 'openid profile email',
      state,
      nonce,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    }).toString()

    res.setHeader('Set-Cookie', setCookie(OAUTH_COOKIE, ticket, 600))
    res.setHeader('Cache-Control', 'no-store')
    res.statusCode = 302
    res.setHeader('Location', url.toString())
    res.end()
  } catch (err) {
    console.error('login error', err)
    res.statusCode = 500
    res.end('Sign-in is unavailable')
  }
}