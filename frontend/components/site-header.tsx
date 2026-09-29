"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { fetchUnreadConversationsCount } from "@/lib/api";
import { useIsMounted } from "@/lib/use-is-mounted";

export function SiteHeader() {
  const { isAuthenticated, isRefreshing, isRestoring, logout, session, sessionNotice, auth } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const isMounted = useIsMounted();
  const [unreadCount, setUnreadCount] = useState(0);

  // Polling de conteo de mensajes no leídos cada 10s
  useEffect(() => {
    if (!auth) {
      return;
    }
    const currentAuth = auth;
    async function poll() {
      try {
        const count = await fetchUnreadConversationsCount(currentAuth);
        setUnreadCount(count);
      } catch {
        // Ignorar errores silenciosamente
      }
    }
    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [auth]);

  // Actualizar conteo cuando se lee un mensaje
  useEffect(() => {
    function onMessagesRead() {
      if (!auth) return;
      void fetchUnreadConversationsCount(auth).then(setUnreadCount);
    }
    window.addEventListener("messages-read", onMessagesRead);
    return () => window.removeEventListener("messages-read", onMessagesRead);
  }, [auth]);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const noticeStyles =
    sessionNotice?.type === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : sessionNotice?.type === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-sky-200 bg-sky-50 text-sky-700";

  return (
    <header className={`sticky top-0 z-30 border-b border-line/70 bg-[#fffdf9]/75 backdrop-blur-2xl transition-shadow duration-300 ${scrolled ? "shadow-[0_4px_20px_rgba(0,0,0,0.06)]" : ""}`}>
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        {isMounted && (isRestoring || isRefreshing || sessionNotice) ? (
          <div
            className={`mb-3 rounded-[18px] border px-4 py-2 text-sm ${
              isRestoring || isRefreshing ? "border-sky-200 bg-sky-50 text-sky-700" : noticeStyles
            }`}
          >
            {isRestoring
              ? "Restaurando sesion..."
              : isRefreshing
                ? "Renovando tu sesion..."
                : sessionNotice?.message}
          </div>
        ) : null}

        <div className="hidden items-center justify-between gap-6 lg:flex">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/EMBLEMA.png" alt="Terrify" width={44} height={44} className="h-11 w-11 rounded-full object-contain shadow-[0_14px_24px_rgba(122,59,36,0.24)]" />
              <div className="leading-tight">
                <p className="text-base font-semibold text-primary">Terrify</p>
                <p className="text-xs text-stone">Compra y vende terrenos con claridad</p>
              </div>
            </Link>

            <nav className="flex items-center gap-1.5 rounded-full border border-line/80 bg-white/80 p-1 text-sm font-medium text-stone shadow-[0_12px_24px_rgba(15,23,42,0.05)]">
              <Link href="/" title="Explorar terrenos" className={`rounded-full px-4 py-2 transition hover:bg-sand hover:text-ink active:scale-95 ${pathname === "/" ? "bg-sand text-ink" : ""}`}>
                Explorar
              </Link>
              {isAuthenticated && (
                <Link href="/favoritos" title="Ver terrenos guardados" className={`rounded-full px-4 py-2 transition hover:bg-sand hover:text-ink active:scale-95 ${pathname === "/favoritos" ? "bg-sand text-ink" : ""}`}>
                  Guardados
                </Link>
              )}
              {isAuthenticated && (
                <Link href="/mensajes" title="Mensajes" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line/60 bg-white transition hover:bg-sand">
                  <svg className="h-5 w-5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-danger text-[10px] font-bold text-white flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              )}
              <Link href="/guia-legal" title="Guía antifraude" className="flex items-center gap-1.5 rounded-full px-4 py-2 font-bold text-primary/90 transition hover:bg-primary/5 hover:text-primary active:scale-95">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                Antifraude
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/publicar"
              className="rounded-full bg-cta px-5 py-2 text-sm font-bold text-text shadow-[0_4px_14px_rgba(209,154,61,0.3)] transition hover:-translate-y-px hover:bg-cta-dark hover:shadow-[0_6px_20px_rgba(209,154,61,0.4)] active:scale-95"
            >
              Publica gratis
            </Link>
            {isAuthenticated && session ? (
              <>
                <span className="rounded-full border border-line bg-white/85 px-4 py-2 text-sm text-stone max-w-[200px] truncate">
                  {session.user.fullName || session.user.email.split("@")[0] || "Mi Cuenta"}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-line bg-white/85 px-4 py-2 text-sm font-medium text-ink transition hover:border-ink"
                >
                  Cerrar sesion
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-line bg-white/85 px-4 py-2 text-sm font-medium text-ink transition hover:border-ink"
              >
                Iniciar sesion
              </Link>
            )}
          </div>
        </div>

        <div className="lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/EMBLEMA.png" alt="Terrify" width={44} height={44} className="h-11 w-11 rounded-full object-contain shadow-[0_10px_24px_rgba(122,59,36,0.24)]" />
              <div className="leading-tight">
                <p className="text-base font-semibold text-primary">Terrify</p>
                <p className="text-xs text-stone">Terrenos en tu zona</p>
              </div>
            </Link>

            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white text-ink"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-5 w-5"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {isMobileMenuOpen ? (
            <div
              id="mobile-menu"
              className="glass-panel mt-4 rounded-[28px] border border-white/80 p-4 shadow-panel animate-slide-down"
            >
              <div className="space-y-1 text-sm font-medium text-ink">
                <Link
                  href="/"
                  className="block rounded-2xl px-4 py-3 transition hover:bg-sand"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Explorar terrenos
                </Link>
                {isAuthenticated && (
                  <Link
                    href="/favoritos"
                    className="block rounded-2xl px-4 py-3 transition hover:bg-sand"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Guardados
                  </Link>
                )}
                {isAuthenticated && (
                  <Link
                    href="/mensajes"
                    className="flex items-center gap-2 rounded-2xl px-4 py-3 transition hover:bg-sand"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                    Mensajes
                    {unreadCount > 0 && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Link>
                )}
                <Link
                  href="/guia-legal"
                  className="flex items-center gap-2 rounded-2xl px-4 py-3 font-bold text-primary transition hover:bg-primary/5"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  Guía Antifraude
                </Link>
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full rounded-2xl px-4 py-3 text-left transition hover:bg-sand"
                  >
Cerrar sesión
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="block rounded-2xl px-4 py-3 transition hover:bg-sand"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
Iniciar sesión
                  </Link>
                )}

                <div className="mt-3 border-t border-line/40 pt-3">
                  <Link
                    href="/publicar"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-2xl bg-cta px-4 py-3.5 text-sm font-bold text-text transition hover:bg-cta-dark active:scale-95"
                  >
                    Publica tu terreno gratis →
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
