"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useAuth } from "@/components/auth-provider";
import { useIsMounted } from "@/lib/use-is-mounted";

type ProtectedActionProps = {
  actionLabel: string;
  authenticatedHref: string;
  unauthenticatedHref: string;
  className?: string;
};

export function ProtectedAction({
  actionLabel,
  authenticatedHref,
  unauthenticatedHref,
  className,
}: ProtectedActionProps) {
  const { isAuthenticated } = useAuth();

  return (
    <Link href={isAuthenticated ? authenticatedHref : unauthenticatedHref} className={className}>
      {actionLabel}
    </Link>
  );
}

type GuardedPanelProps = {
  title: string;
  description: string;
  ctaLabel: string;
  loginHref: string;
  children: ReactNode;
};

export function GuardedPanel({
  title,
  description,
  ctaLabel,
  loginHref,
  children,
}: GuardedPanelProps) {
  const { isAuthenticated, isReady, isRestoring, sessionNotice } = useAuth();
  const isMounted = useIsMounted();

  if (!isMounted || !isReady || isRestoring) {
    return (
      <section className="rounded-[32px] border border-white/80 bg-white/88 p-8 shadow-panel">
        <p className="text-sm text-stone">Restaurando sesion...</p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
        <section className="rounded-[32px] border border-white/80 bg-white/88 p-8 shadow-panel">
          <span className="inline-flex rounded-full bg-cta/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cta">
          Acceso requerido
        </span>
        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-ink">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-stone">{description}</p>
        {sessionNotice?.type === "error" ? (
          <p className="mt-4 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {sessionNotice.message}
          </p>
        ) : null}
        <Link
          href={loginHref}
          className="mt-6 inline-flex rounded-full bg-cta px-5 py-3 text-sm font-semibold text-text transition hover:-translate-y-0.5 hover:bg-cta-dark"
        >
          {ctaLabel}
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-[32px] border border-white/80 bg-white/88 p-8 shadow-panel">
      {children}
    </section>
  );
}
