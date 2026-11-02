import { next } from '@vercel/functions'
import { authConfigured, verifyToken, getCookie, SESSION_COOKIE } from './lib/auth.js'

export const config = {
  matcher: ['/((?!api/auth|favicon.ico).*)'],
}

export default async function middleware(request) {
  // Dormant until Okta env vars exist
  if (!authConfigured()) return next()

  const token = getCookie(request.headers.get('cookie'), SESSION_COOKIE)
  if (token && (await verifyToken(token))) return next()

    const url = new URL(request.url)

  // Background API calls get a 401 the page can react to, not a redirect
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'Not signed in' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    })
  }

  const login = new URL('/api/auth/login', url.origin)
  login.searchParams.set('next', url.pathname + url.search)
  return Response.redirect(login, 302)
}