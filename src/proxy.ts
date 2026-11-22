import { type NextRequest, NextResponse } from "next/server";

/*
 * Proxy (ex-middleware de Next.js) — guide : node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md
 * 1. CSP stricte à nonce, nouvelle à chaque requête (Next.js l'applique à ses propres scripts).
 * 2. Identifiant de requête x-request-id, repris par les journaux.
 * 3. Redirection OPTIMISTE de /studio vers /login sans cookie de session. Ce n'est pas un contrôle d'accès :
 *    la vérification qui fait foi est faite par la DAL (requireOwner) dans chaque page et chaque action.
 */

const SESSION_COOKIE = "__Host-dzl.sid";

function contentSecurityPolicy(nonce: string, isDev: boolean): string {
  return [
    "default-src 'self'",
    // 'unsafe-eval' uniquement en développement (exigé par React pour ses outils de débogage).
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/studio") && !request.cookies.has(SESSION_COOKIE)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = contentSecurityPolicy(nonce, process.env.NODE_ENV === "development");
  const requestId = crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-request-id", requestId);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: [
    {
      // Toutes les pages, sauf fichiers statiques et préchargements (inutiles pour la CSP).
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
