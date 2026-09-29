"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error capturado por error boundary:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-sand px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white p-10 text-center shadow-lg">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <svg
            className="h-8 w-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-ink">Algo salió mal</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          Ocurrió un error inesperado. Nuestro equipo ha sido notificado.
        </p>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-2xl bg-cta py-3.5 text-sm font-bold text-text shadow-md transition hover:bg-cta-dark"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="block w-full rounded-2xl border border-line py-3.5 text-sm font-medium text-ink transition hover:border-ink"
          >
            Volver al inicio
          </Link>
        </div>

        <p className="mt-6 text-xs text-stone/60">
          Si el problema persiste, contáctanos en{" "}
          <span className="font-medium text-cta">soporte@terrify.mx</span>
        </p>
      </div>
    </main>
  );
}
