"use client";

import { useState } from "react";

type ShareButtonProps = {
  title: string;
  text?: string;
};

export function ShareButton({ title, text }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: text ?? `Mira este terreno en Terrify: ${title}`,
          url: window.location.href,
        });
      } catch {
        // El usuario canceló o la API no está disponible — silencioso
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Nada que hacer si falla
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition hover:scale-105 hover:bg-white"
        aria-label="Compartir"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <path d="M16 6l-4-4-4 4" />
          <path d="M12 2v13" />
        </svg>
      </button>
      {copied && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white shadow-lg">
          Copiado
        </div>
      )}
    </div>
  );
}
