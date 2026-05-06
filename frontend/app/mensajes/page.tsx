"use client";

import { SiteHeader } from "@/components/site-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ConversationsList } from "@/components/conversations-list";

export default function MensajesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-sand">
      <SiteHeader />
      
      <div className="flex-1 mx-auto w-full max-w-7xl">
        <div className="flex h-[calc(100vh-65px)]">
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 border-r border-line/40 bg-white flex flex-col">
            <div className="px-4 py-4 border-b border-line/40">
              <h1 className="text-xl font-bold text-ink">Mensajes</h1>
            </div>
            <ConversationsList compact />
          </div>

          <div className="hidden lg:flex flex-1">
            <div className="flex-1 flex items-center justify-center bg-sand/50">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-white border border-line/60 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-stone/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                </div>
                <p className="font-semibold text-ink">Selecciona una conversación</p>
                <p className="text-sm text-stone mt-1">Elige un mensaje de la lista para responder</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}