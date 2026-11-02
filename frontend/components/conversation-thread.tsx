"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { fetchMessages, sendMessage, markConversationAsRead } from "@/lib/api";
import type { Message } from "@/lib/types";

export function ConversationThread({ contactId, showBackButton = false }: { contactId: string; showBackButton?: boolean }) {
  const { auth } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Marcar como leído al montar
  useEffect(() => {
    if (!auth) return;
    markConversationAsRead(auth, contactId)
      .then(() => {
        window.dispatchEvent(new Event("messages-read"));
      })
      .catch(() => {});
  }, [contactId, auth]);

  // Cargar mensajes al montar
  useEffect(() => {
    if (!auth) return;
    fetchMessages(contactId, auth)
      .then((msgs) => {
        const unique = Array.from(new Map(msgs.map((m) => [m.id, m])).values());
        setMessages(unique);
      })
      .catch(() => {
        setError("No se pudieron cargar los mensajes.");
      });
  }, [contactId, auth]);

  // Polling cada 5 segundos — merge sin duplicados
  useEffect(() => {
    if (!auth) return;
    const interval = setInterval(() => {
      fetchMessages(contactId, auth)
        .then((newMessages) => {
          setMessages((prev) => {
            const uniquePrev = new Map(prev.map((m) => [m.id, m]));
            newMessages.forEach((m) => uniquePrev.set(m.id, m));
            const uniqueMessages = Array.from(uniquePrev.values());
            return uniqueMessages.sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          });
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [contactId, auth]);

  // Scroll al último mensaje solo cuando se envía nuevo mensaje
  const lastMessageCountRef = useRef(0);
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current && lastMessageCountRef.current > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    lastMessageCountRef.current = messages.length;
  }, [messages]);

  async function handleSend() {
    if (!auth || !input.trim()) return;
    setIsSending(true);
    setError(null);
    try {
      const newMsg = await sendMessage(contactId, input.trim(), auth);
      setMessages((prev) => [...prev, newMsg]);
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header con botón volver */}
      {showBackButton && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-line/40 bg-white lg:hidden">
          <Link href="/mensajes" className="p-1 -ml-1">
            <svg className="h-5 w-5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </Link>
          <p className="font-semibold text-ink text-sm">Conversación</p>
        </div>
      )}

      {/* Aviso de seguridad */}
      <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
        <p className="text-xs text-amber-700 font-medium text-center">
          🔒 Por tu seguridad, no compartas datos de contacto fuera de la plataforma
        </p>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-stone py-8">
            Aún no hay mensajes. ¡Inicia la conversación!
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
              msg.isMine
                ? "bg-cta text-text rounded-br-sm"
                : "bg-white border border-line/60 text-ink rounded-bl-sm"
            }`}>
              {!msg.isMine && (
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-60">
                  {msg.senderName}
                </p>
              )}
              <p className="text-sm leading-relaxed">{msg.body}</p>
              {msg.isFlagged && (
                <p className="text-[10px] mt-1 opacity-60">
                  ⚠️ Mensaje en revisión
                </p>
              )}
              <p className={`text-[10px] mt-1 ${msg.isMine ? "text-white/60" : "text-stone/50"}`}>
                {new Date(msg.createdAt).toLocaleTimeString("es-MX", {
                  hour: "2-digit", minute: "2-digit"
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <p className="px-4 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
          {error}
        </p>
      )}

      {/* Input */}
      <div className="border-t border-line/60 px-4 py-3 bg-white">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Escribe tu mensaje..."
            rows={1}
            maxLength={1000}
            className="flex-1 resize-none rounded-2xl border border-line/60 bg-sand px-4 py-3 text-sm text-ink placeholder:text-stone/50 outline-none focus:border-cta/50 max-h-32"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-cta text-white shadow-md transition hover:bg-cta-dark disabled:opacity-40"
          >
            {isSending ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            )}
          </button>
        </div>
        <p className="mt-1 text-right text-[10px] text-stone/50">
          {input.length}/1000
        </p>
      </div>
    </div>
  );
}
