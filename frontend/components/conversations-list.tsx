"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { fetchMyConversations } from "@/lib/api";
import type { ContactRequest } from "@/lib/types";

type ConversationsListProps = {
  activeId?: string;
  compact?: boolean;
};

export function ConversationsList({ activeId, compact = false }: ConversationsListProps) {
  const { auth, session } = useAuth();
  const [conversations, setConversations] = useState<ContactRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!auth) return;
    const currentAuth = auth;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchMyConversations(currentAuth);
        setConversations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar conversaciones");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [auth]);

  const currentUserEmail = session?.user.email?.toLowerCase();
  
  const filtered = conversations.filter((c) => {
    if (filter === "unread") {
      const isBuyer = currentUserEmail && c.buyerEmail.toLowerCase() === currentUserEmail;
      return isBuyer && c.status === "pending";
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sand border-t-coral" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
          <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <p className="text-sm text-red-600 font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-3 text-xs text-cta hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="h-12 w-12 rounded-full bg-sand flex items-center justify-center mb-3">
          <svg className="h-6 w-6 text-stone/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        </div>
        <p className="text-sm text-stone">
          {filter === "unread" ? "No hay mensajes sin leer" : "No hay conversaciones"}
        </p>
      </div>
    );
  }

  return (
    <div className={compact ? "" : "flex flex-col"}>
      {!compact && (
        <div className="flex gap-2 px-4 py-3 border-b border-line/40">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === "all" 
                ? "bg-ink text-white" 
                : "text-stone hover:bg-sand"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === "unread" 
                ? "bg-ink text-white" 
                : "text-stone hover:bg-sand"
            }`}
          >
            Sin leer
          </button>
        </div>
      )}
      
      <div className="overflow-y-auto flex-1">
        {filtered.map((contact) => (
          <ConversationItem 
            key={contact.id} 
            contact={contact} 
            isActive={activeId === contact.id}
            currentUserEmail={session?.user.email}
          />
        ))}
      </div>
    </div>
  );
}

function ConversationItem({ 
  contact, 
  isActive,
  currentUserEmail 
}: { 
  contact: ContactRequest; 
  isActive: boolean;
  currentUserEmail?: string;
}) {
  const isBuyer = currentUserEmail && contact.buyerEmail.toLowerCase() === currentUserEmail.toLowerCase();
  const otherPersonName = isBuyer 
    ? "Vendedor" 
    : contact.buyerName;
  
  const lastMsg = contact.lastMessage;
  const hasUnread = isBuyer && contact.status === "pending";
  const timeAgo = lastMsg ? formatRelativeTime(lastMsg.createdAt) : formatRelativeTime(contact.createdAt);

  return (
    <Link
      href={`/mensajes/${contact.id}`}
      className={`flex items-start gap-3 px-4 py-4 transition hover:bg-sand border-b border-line/40 ${
        isActive ? "bg-sand border-l-2 border-l-coral" : ""
      }`}
    >
      <div className="flex-shrink-0 h-11 w-11 rounded-full bg-cta/10 flex items-center justify-center font-bold text-cta">
        {otherPersonName?.[0]?.toUpperCase() ?? "?"}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${hasUnread ? "font-bold text-ink" : "font-medium text-ink"}`}>
            {otherPersonName}
          </p>
          <span className="text-[10px] text-stone flex-shrink-0">
            {timeAgo}
          </span>
        </div>

        <p className="text-xs text-stone truncate mt-0.5">
          {contact.terreno.title}
        </p>

        {lastMsg && (
          <p className={`text-xs truncate mt-1 ${hasUnread ? "text-ink font-medium" : "text-stone"}`}>
            {lastMsg.body}
          </p>
        )}
      </div>

      {hasUnread && (
        <div className="flex-shrink-0 h-2.5 w-2.5 rounded-full bg-cta mt-1" />
      )}
    </Link>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "ahora";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}