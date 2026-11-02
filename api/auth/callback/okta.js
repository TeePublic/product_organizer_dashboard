import { createRemoteJWKSet, jwtVerify } from 'jose'
import {
  signToken, verifyToken, getCookie, setCookie, discover, safeNext,
  SESSION_COOKIE, OAUTH_COOKIE,
} from '../../../lib/auth.js'

export default async function handler(req, res) {
  try {
    const ticket = await verifyToken(getCookie(req.headers.cookie, OAUTH_COOKIE) || '')
    const { code, state } = req.query
    if (!ticket || !code || state !== ticket.state) {
      res.statusCode = 400
      return res.end('Invalid sign-in request. Please try again.')
    }

    const config = await discover()
    const redirectUri = `https://${req.headers.host}/api/auth/callback/okta`
    const basic = Buffer.from(
      `${process.env.AUTH_OKTA_ID}:${process.env.AUTH_OKTA_SECRET}`
    ).toString('base64')

    const tokenRes = await fetch(config.token_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        Authorization: `Basic ${basic}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: ticket.verifier,
      }),
    })
    if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`)
    const tokens = await tokenRes.json()

    const { payload } = await jwtVerify(
      tokens.id_token,
      createRemoteJWKSet(new URL(config.jwks_uri)),
      { issuer: config.issuer, audience: process.env.AUTH_OKTA_ID }
    )
    if (payload.nonce !== ticket.nonce) throw new Error('Nonce mismatch')

    const maxAge = 8 * 3600
    const session = await signToken(
      { sub: payload.sub, email: payload.email, name: payload.name },
      maxAge
    )
    res.setHeader('Set-Cookie', [
      setCookie(SESSION_COOKIE, session, maxAge),
      setCookie(OAUTH_COOKIE, '', 0),
    ])
    res.setHeader('Cache-Control', 'no-store')
    res.statusCode = 302
    res.setHeader('Location', safeNext(ticket.next))
    res.end()
  } catch (err) {
    console.error('callback error', err)
    res.statusCode = 500
    res.end('Sign-in failed')
  }
}