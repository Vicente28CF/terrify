"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { getApiBaseUrl } from "@/lib/api";

function ReenviarVerificacionContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function handleResend() {
    setStatus("loading");

    try {
      const baseUrl = await getApiBaseUrl();
      await fetch(`${baseUrl}/auth/resend-verification/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailParam }),
      });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sand px-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/60 bg-white p-10 text-center shadow-lg">
        <h1 className="text-xl font-bold text-ink">Reenviar verificacion</h1>
        <p className="mt-2 text-sm text-stone">
          Te mandaremos un nuevo enlace a{" "}
          <span className="font-semibold text-ink">{emailParam || "tu correo"}</span>
        </p>

        {status === "sent" ? (
          <div className="mt-6 rounded-2xl bg-success/15 px-4 py-3 text-sm text-success">
            Si el email existe, recibiras un nuevo enlace en unos minutos.
          </div>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={status === "loading"}
            className="mt-6 w-full rounded-2xl bg-cta py-3.5 text-sm font-bold text-text transition hover:bg-cta-dark disabled:opacity-40"
          >
            {status === "loading" ? "Enviando..." : "Reenviar enlace"}
          </button>
        )}

        {status === "error" ? (
          <p className="mt-3 text-xs text-red-500">Algo salio mal. Intenta de nuevo.</p>
        ) : null}

        <Link
          href="/login"
          className="mt-4 block text-xs text-stone/60 transition hover:text-cta"
        >
          Volver al login
        </Link>
      </div>
    </main>
  );
}

export default function ReenviarVerificacionPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-sand px-4">
          <div className="text-sm text-stone">Cargando...</div>
        </main>
      }
    >
      <ReenviarVerificacionContent />
    </Suspense>
  );
}
