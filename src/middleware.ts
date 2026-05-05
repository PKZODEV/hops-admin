import { NextRequest, NextResponse } from 'next/server';

/**
 * Route guard for the admin console.
 *
 * Any request that does not match a public path is redirected to `/login`
 * unless an `hops_token` cookie is present. A signed-in user landing on
 * `/login` is sent back to the dashboard root.
 *
 * The cookie is HTTP-only and is the authoritative authentication
 * credential. This guard performs a presence check only; the backend
 * remains responsible for validating the token on every API call.
 */

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('hops_token')?.value;
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico|data/).*)'],
};
