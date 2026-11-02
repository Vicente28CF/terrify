"use client";

import { useState, type FormEvent } from "react";

import { useAuth } from "@/components/auth-provider";
import { createContactRequest } from "@/lib/api";

type ContactFormPanelProps = {
  terrenoSlug: string;
  terrenoTitle: string;
};

type FormStatus = {
  type: "idle" | "loading" | "success" | "error";
  message: string;
};

export function ContactFormPanel({
  terrenoSlug,
  terrenoTitle,
  ownerEmail,
}: ContactFormPanelProps & { ownerEmail?: string }) {
  const { auth, session } = useAuth();

  const isOwner = session?.user.email && ownerEmail && session.user.email.toLowerCase() === ownerEmail.toLowerCase();
  const [form, setForm] = useState({
    buyerName: session?.user.fullName ?? "",
    buyerEmail: session?.user.email ?? "",
    buyerPhone: session?.user.phone ?? "",
    message: `Hola, me interesa "${terrenoTitle}" y quiero recibir mas informacion sobre disponibilidad y forma de contacto.`,
  });
  const [status, setStatus] = useState<FormStatus>({
    type: "idle",
    message: "",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!auth) {
      setStatus({
        type: "error",
        message: "Tu sesion no es valida. Vuelve a iniciar sesion.",
      });
      return;
    }

    setStatus({
      type: "loading",
      message: "Enviando solicitud...",
    });

    try {
      await createContactRequest(
        {
          terrenoSlug,
          buyerName: form.buyerName,
          buyerEmail: form.buyerEmail,
          buyerPhone: form.buyerPhone,
          message: form.message,
        },
        auth,
      );

      setStatus({
        type: "success",
        message: "Solicitud enviada. El vendedor podra revisarla desde su panel.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo enviar la solicitud de contacto.",
      });
    }
  }

  if (isOwner) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
        <svg className="mx-auto h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="mt-3 text-sm font-medium text-amber-800">
          Este es tu terreno. No puedes contactar tu propia publicación.
        </p>
        <a
          href="/publicar"
          className="mt-3 inline-block text-sm font-semibold text-amber-700 underline hover:text-amber-900"
        >
          Gestionar mis terrenos →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <span className="inline-flex rounded-full bg-cta/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cta">
        Sesion activa
      </span>
      <div>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">Solicitar informacion</h2>
        <p className="mt-2 text-sm leading-7 text-stone">
          Tu mensaje se envia de forma mediada. El vendedor recibe la solicitud desde su panel sin
          exponer contacto directo en publico.
        </p>
      </div>

      <div className="grid gap-3">
        <label className="rounded-[24px] border border-line bg-[#fcfaf7] px-4 py-3 transition focus-within:border-cta/40 focus-within:bg-white">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone">
            Nombre
          </span>
          <input
            type="text"
            className="w-full bg-transparent text-sm font-medium text-ink outline-none"
            value={form.buyerName}
            onChange={(event) => setForm((current) => ({ ...current, buyerName: event.target.value }))}
            required
          />
        </label>

        <label className="rounded-[24px] border border-line bg-[#fcfaf7] px-4 py-3 transition focus-within:border-cta/40 focus-within:bg-white">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone">
            Email
          </span>
          <input
            type="email"
            className="w-full bg-transparent text-sm font-medium text-ink outline-none"
            value={form.buyerEmail}
            onChange={(event) => setForm((current) => ({ ...current, buyerEmail: event.target.value }))}
            required
          />
        </label>

        <label className="rounded-[24px] border border-line bg-[#fcfaf7] px-4 py-3 transition focus-within:border-cta/40 focus-within:bg-white">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone">
            Telefono
          </span>
          <input
            type="tel"
            className="w-full bg-transparent text-sm font-medium text-ink outline-none"
            value={form.buyerPhone}
            onChange={(event) => setForm((current) => ({ ...current, buyerPhone: event.target.value }))}
          />
        </label>

        <label className="rounded-[24px] border border-line bg-[#fcfaf7] px-4 py-3 transition focus-within:border-cta/40 focus-within:bg-white">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone">
            Mensaje
          </span>
          <textarea
            rows={5}
            minLength={20}
            className="w-full resize-none bg-transparent text-sm leading-7 text-ink outline-none"
            value={form.message}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            required
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={status.type === "loading"}
        className="inline-flex w-full items-center justify-center rounded-[24px] bg-cta px-5 py-4 text-sm font-semibold text-text shadow-[0_16px_30px_rgba(209,154,61,0.28)] transition hover:-translate-y-0.5 hover:bg-cta-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status.type === "loading" ? "Enviando..." : "Enviar solicitud"}
      </button>

      <div className="min-h-6 text-sm">
        {status.type === "error" ? (
          <p className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-red-600">
            {status.message}
          </p>
        ) : null}
        {status.type === "success" ? (
          <p className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
            {status.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
