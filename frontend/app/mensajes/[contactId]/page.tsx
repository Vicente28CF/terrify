"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ConversationThread } from "@/components/conversation-thread";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ConversationsList } from "@/components/conversations-list";
import { TerrenoInfoPanel } from "@/components/terreno-info-panel";

function ConversacionContent({ contactId }: { contactId: string }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-line/40 bg-white">
        <Link href="/mensajes" className="p-1 -ml-1 lg:hidden">
          <svg className="h-5 w-5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </Link>
        <p className="font-semibold text-ink text-sm lg:hidden">Conversación</p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center flex-1">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-background border-t-cta"/>
        </div>
      }>
        <ConversationThread contactId={contactId} showBackButton={false} />
      </Suspense>
    </div>
  );
}

export default function ConversacionPage({
  params,
}: {
  params: Promise<{ contactId: string }>;
}) {
  const resolvedParams = use(params);
  const contactId = resolvedParams.contactId;

  return (
    <div className="flex flex-col min-h-screen bg-sand">
      <SiteHeader />
      
      <div className="flex-1 mx-auto w-full max-w-7xl">
        <div className="flex h-[calc(100vh-65px)]">
          <div className="hidden lg:flex w-72 xl:w-80 flex-shrink-0 border-r border-line/40 bg-white flex-col">
            <div className="px-4 py-4 border-b border-line/40">
              <Link href="/mensajes" className="flex items-center gap-2 text-sm font-medium text-cta hover:underline">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                </svg>
                Volver
              </Link>
            </div>
            <ConversationsList activeId={contactId} compact />
          </div>

          <div className="flex-1 flex flex-col bg-white">
            <ConversacionContent contactId={contactId} />
          </div>

          <TerrenoInfoPanel contactId={contactId} />
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}