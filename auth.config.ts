import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isLoginPage = pathname.startsWith('/login');
      const isAdminArea = pathname.startsWith('/admin');

      if (isLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL('/dashboard', request.nextUrl));
        return true;
      }

      if (!isLoggedIn) {
        return false;
      }

      if (isAdminArea && auth.user.role !== 'ADMIN') {
        return false;
      }

      return true;
    },
  },
};
