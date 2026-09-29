"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getApiBaseUrl } from "@/lib/api";

type Status = "loading" | "success" | "error" | "already";

export default function VerificarEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "" : "Token no encontrado.");

  useEffect(() => {
    if (!token) {
      return;
    }

    let isCancelled = false;
    let timeoutId: number | undefined;

    async function verify() {
      try {
        const baseUrl = await getApiBaseUrl();
        const response = await fetch(`${baseUrl}/auth/verify-email/?token=${token}`);
        const data = (await response.json()) as { detail?: string };

        if (isCancelled) {
          return;
        }

        if (response.ok) {
          setStatus("success");
          setMessage(data.detail ?? "Cuenta verificada correctamente.");
          timeoutId = window.setTimeout(() => {
            router.push("/login?verified=true");
          }, 3000);
          return;
        }

        setStatus("error");
        setMessage(data.detail ?? "No se pudo verificar tu cuenta.");
      } catch {
        if (!isCancelled) {
          setStatus("error");
          setMessage("Error de conexion. Intenta de nuevo.");
        }
      }
    }

    void verify();

    return () => {
      isCancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [router, token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-sand px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white p-10 text-center shadow-lg">
        {status === "loading" ? (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-background border-t-cta" />
            <p className="text-sm text-stone">Verificando tu cuenta...</p>
          </>
        ) : null}

        {status === "success" ? (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
              <svg
                className="h-8 w-8 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-ink">Cuenta verificada</h1>
            <p className="mt-2 text-sm text-stone">{message}</p>
            <p className="mt-1 text-xs text-stone/60">Redirigiendo al login...</p>
          </>
        ) : null}

        {status === "error" ? (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <svg
                className="h-8 w-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-ink">Enlace invalido</h1>
            <p className="mt-2 text-sm text-stone">{message}</p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-full bg-cta px-6 py-2.5 text-sm font-bold text-text transition hover:bg-cta-dark"
            >
              Volver al login
            </Link>
          </>
        ) : null}
      </div>
    </main>
  );
}
