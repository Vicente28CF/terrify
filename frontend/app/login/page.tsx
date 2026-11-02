import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Iniciar sesión | Terrify",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-sand pb-24 md:pb-0">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid min-h-[600px] overflow-hidden rounded-[2.5rem] border border-white/60 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.06)] lg:grid-cols-[1fr_1fr]">
          
          {/* Columna izquierda — Branding — OCULTO en mobile */}
          <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-ink p-10 lg:p-14">
            
            {/* Decoración de fondo */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cta/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-cta/10 blur-3xl" />

            {/* Logo */}
            <Link href="/" className="relative flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-cta text-sm font-bold text-white shadow-[0_8px_20px_rgba(209,154,61,0.4)]">
                LX
              </div>
              <span className="text-lg font-semibold text-white">Terrify</span>
            </Link>

            {/* Mensaje central */}
            <div className="relative space-y-6">
              <h1 className="text-[2.2rem] font-bold leading-[1.1] tracking-[-0.03em] text-white lg:text-[2.8rem]">
                Tu terreno<br />
                <span className="text-cta">te está esperando.</span>
              </h1>
              <p className="max-w-xs text-base leading-relaxed text-white/60">
                Inicia sesión para guardar favoritos, publicar terrenos y contactar vendedores directo.
              </p>

              {/* 3 puntos clave — minimalistas */}
              <div className="space-y-3 pt-2">
                {[
                  "Explora sin registrarte",
                  "Publica y vende más rápido",
                  "Contacto directo, sin intermediarios",
                ].map((point) => (
                  <div key={point} className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cta" />
                    <p className="text-sm font-medium text-white/70">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer izquierdo */}
            <p className="relative text-xs text-white/30">
              © 2026 Terrify · Jalisco, México
            </p>
          </div>

          {/* Columna derecha — Formulario */}
          <div className="flex items-center justify-center p-8 lg:p-14">
            <div className="w-full max-w-sm">
              <Suspense fallback={
                <div className="text-sm text-stone">Cargando...</div>
              }>
                <AuthForm defaultMode="login" />
              </Suspense>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
