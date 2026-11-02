import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página no encontrada | Terrify",
};

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-sand px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white p-10 text-center shadow-lg">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-cta/10">
          <svg
            className="h-8 w-8 text-cta"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-6xl font-bold text-ink">404</h1>
        <p className="mt-4 text-lg font-medium text-stone">
          Esta página no existe o fue removida.
        </p>
        <p className="mt-2 text-sm text-stone/70">
          El enlace que seguiste podría estar roto o la página ya no está disponible.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href="/"
            className="block w-full rounded-2xl bg-cta py-3.5 text-sm font-bold text-text shadow-md transition hover:bg-cta-dark"
          >
            Explorar terrenos
          </Link>
          <Link
            href="/login"
            className="block w-full rounded-2xl border border-line py-3.5 text-sm font-medium text-ink transition hover:border-ink"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
