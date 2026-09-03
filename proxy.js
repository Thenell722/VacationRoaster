/**
 * Authentication proxy for the application.
 *
 * This proxy runs before protected pages are served and controls
 * access based on the user's authentication status.
 *
 * - Redirects unauthenticated users to the login page.
 * - Preserves the originally requested URL using `callbackUrl` so users
 *   can be returned there after logging in.
 * - Redirects authenticated users away from the login page to the dashboard.
 * - Allows all other valid requests to continue normally.
 * - Excludes API routes, Next.js static assets, images, and other public
 *   resources from authentication checks.
 */

import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export default async function proxy(req) {
  const { pathname } = req.nextUrl;
  const isPublic = pathname.startsWith('/login');
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token && !isPublic) {
    const url = new URL('/login', req.nextUrl.origin);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  if (token && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
