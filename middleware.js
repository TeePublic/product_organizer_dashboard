import { next } from '@vercel/functions'
import { authConfigured, verifyToken, getCookie, SESSION_COOKIE } from './lib/auth.js'

export const config = {
  matcher: ['/((?!api/auth|favicon.ico).*)'],
}

// Vercel cron jobs that call us without a login: the roadmap pull, the CVR refresh and the A/B refresh
const CRON_PATHS = ['/api/roadmap-refresh', '/api/refresh-cvr', '/api/ab-refresh']

export default async function middleware(request) {
  // Dormant until Okta env vars exist
  if (!authConfigured()) return next()

  const url = new URL(request.url)

  // Vercel cron jobs (roadmap pull, CVR refresh): only these paths, only with the exact secret
  const secret = process.env.CRON_SECRET
  if (secret && CRON_PATHS.includes(url.pathname) && request.headers.get('authorization') === `Bearer ${secret}`) return next()

  const token = getCookie(request.headers.get('cookie'), SESSION_COOKIE)
  if (token && (await verifyToken(token))) return next()

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