"use client";

import { useState } from "react";
import Link from "next/link";

import { useAuth } from "@/components/auth-provider";
import { ContactFormPanel } from "@/components/contact-form-panel";

type MobileContactButtonProps = {
  terrenoSlug: string;
  terrenoTitle: string;
  ownerEmail?: string;
};

export function MobileContactBar({ terrenoSlug, terrenoTitle, ownerEmail }: MobileContactButtonProps) {
  const { isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);

  if (showForm) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden">
        <div className="flex items-center justify-between border-b border-line p-4">
          <h3 className="font-display font-semibold text-text">Contactar Vendedor</h3>
          <button
            onClick={() => setShowForm(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-background-alt"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <ContactFormPanel terrenoSlug={terrenoSlug} terrenoTitle={terrenoTitle} ownerEmail={ownerEmail} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-white p-4 shadow-lg lg:hidden">
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line transition hover:bg-background-alt"
          aria-label="Chat"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </Link>

        {isAuthenticated ? (
          <button
            onClick={() => setShowForm(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-cta py-3 font-semibold text-text shadow-lg shadow-cta/20 transition hover:bg-cta-dark active:scale-[0.98]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Contactar Vendedor
          </button>
        ) : (
          <Link
            href={`/login?returnUrl=${encodeURIComponent(`/terrenos/${terrenoSlug}`)}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-cta py-3 font-semibold text-text shadow-lg shadow-cta/20 transition hover:bg-cta-dark active:scale-[0.98]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Contactar Vendedor
          </Link>
        )}
      </div>
    </div>
  );
}
