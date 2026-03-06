import createMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, locales } from "@/i18n/routing";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: true,
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname.startsWith("/admin/login")) {
      const res = NextResponse.next();
      // #region agent log
      res.headers.set("x-mw-debug", "admin-login-passthrough");
      // #endregion
      return res;
    }

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const redirectRes = NextResponse.redirect(new URL("/admin/login", request.url));
      // #region agent log
      redirectRes.headers.set("x-mw-debug", "no-token-redirect");
      // #endregion
      return redirectRes;
    }

    const res = NextResponse.next();
    // #region agent log
    res.headers.set("x-mw-debug", "has-token");
    // #endregion
    return res;
  }

  const intlRes = intlMiddleware(request);
  // #region agent log
  intlRes.headers.set("x-mw-debug", `intl-${pathname}`);
  // #endregion
  return intlRes;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|socket\\.io|sounds|.*\\..*).*)"],
};
