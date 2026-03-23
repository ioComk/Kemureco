import { createServerClient, type CookieOptions } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./src/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // next-intl によるロケールルーティングを先に処理
  const intlResponse = intlMiddleware(request);

  // リダイレクトまたはリライトが発生した場合はそちらを優先
  if (intlResponse.status !== 200) {
    return intlResponse;
  }

  // Supabase セッション管理（Cookieの同期）
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers }
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers }
          });
          response.cookies.set({ name, value: "", ...options });
        }
      }
    }
  );

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // /[locale]/auth ページは常にアクセス可能
  if (/^\/(ja|en|ko)\/auth/.test(pathname)) {
    return response;
  }

  // 未ログインの場合は /[locale]/auth にリダイレクト
  if (!session) {
    // ロケールセグメントを保持してリダイレクト
    const localeMatch = pathname.match(/^\/(ja|en|ko)(\/|$)/);
    const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/auth`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon, icons, manifest
     * - public folder assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico|apple-touch-icon|icon|manifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
