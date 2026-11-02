import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

export default async function RegistroExitosoPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const safeEmail = email ?? "tu correo";

  return (
    <main className="min-h-screen bg-sand">
      <SiteHeader />
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white p-10 text-center shadow-lg">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002 2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Revisa tu email
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-stone">
            Enviamos un enlace de verificacion a{" "}
            <span className="font-semibold text-ink">{safeEmail}</span>.
            <br />
            Haz clic en el enlace para activar tu cuenta.
          </p>

          <div className="mt-6 rounded-2xl bg-sand px-4 py-3 text-xs text-stone">
            ¿No lo encuentras? Revisa tu carpeta de <strong>spam</strong> o correo no deseado.
          </div>

          <div className="mt-8 space-y-3">
            <Link
              href="/login"
              className="block w-full rounded-2xl bg-cta py-3.5 text-sm font-bold text-text shadow-md transition hover:bg-cta-dark"
            >
              Ir al inicio de sesion
            </Link>
            <Link
              href="/"
              className="block w-full rounded-2xl border border-line py-3.5 text-sm font-medium text-ink transition hover:border-ink"
            >
              Explorar terrenos sin cuenta
            </Link>
          </div>

          <p className="mt-6 text-xs text-stone/60">
            ¿No recibiste nada?{" "}
            <Link
              href={`/reenviar-verificacion?email=${encodeURIComponent(safeEmail)}`}
              className="font-medium text-cta hover:underline"
            >
              Reenviar enlace
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
