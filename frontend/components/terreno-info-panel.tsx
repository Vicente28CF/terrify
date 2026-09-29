"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { fetchMyConversations } from "@/lib/api";
import type { ContactRequest } from "@/lib/types";

type TerrenoInfoPanelProps = {
  contactId: string;
};

export function TerrenoInfoPanel({ contactId }: TerrenoInfoPanelProps) {
  const { auth } = useAuth();
  const [contact, setContact] = useState<ContactRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;
    
    fetchMyConversations(auth)
      .then((convs) => {
        const found = convs.find((c) => c.id === contactId);
        setContact(found || null);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [auth, contactId]);

  if (isLoading || !contact) {
    return (
      <div className="hidden lg:flex w-72 flex-shrink-0 border-l border-line/40 bg-white">
        <div className="flex items-center justify-center w-full">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-background border-t-cta" />
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="hidden lg:flex w-72 flex-shrink-0 border-l border-line/40 bg-white flex-col">
      <div className="px-4 py-4 border-b border-line/40">
        <h3 className="font-semibold text-sm text-ink">Terreno</h3>
      </div>

      <div className="aspect-[4/3] bg-sand relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="h-10 w-10 text-stone/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <p className="font-semibold text-ink line-clamp-2">{contact.terreno.title}</p>
          <p className="text-sm text-stone mt-0.5">Jalisco</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-cta">Ver precio</span>
        </div>

        <Link
          href={`/terrenos/${contact.terreno.slug}`}
          target="_blank"
          className="flex items-center justify-center gap-2 w-full rounded-2xl border border-line/60 py-2.5 text-sm font-semibold text-ink hover:bg-sand transition"
        >
          Ver publicación
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M7 7h10v10"/>
          </svg>
        </Link>
      </div>

      <div className="mx-4 mb-4 rounded-2xl bg-amber-50 p-3">
        <p className="text-xs text-amber-700 font-medium">
          🔒 Mantén tu comunicación dentro de Terrify para mayor seguridad.
        </p>
      </div>
    </div>
  );
}