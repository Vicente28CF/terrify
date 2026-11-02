"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "motion/react";
import Fuse from "fuse.js";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Clock, Loader2, MapPin, Search, Trash2, X } from "lucide-react";
import { fetchTerrenos } from "@/lib/api";
import { useDebounce } from "@/lib/use-debounce";
import { cn } from "@/lib/utils";
import type { Terreno } from "@/lib/types";

type Props = {
  value: string;
  isLoading: boolean;
  onSubmit: (value: string) => void;
};

const RECENT_KEY = "terrify_recent_searches";
const MAX_RECENT = 6;
const MAX_SUGGESTIONS = 5;
const MAX_MUNICIPIOS = 2;
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const itemClasses =
  "relative flex cursor-pointer select-none items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-text outline-none transition-colors data-[selected=true]:bg-cta/10";

const sectionLabel =
  "text-[10px] font-bold uppercase tracking-[0.14em] text-stone/55";

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function persistRecentSearches(list: string[]) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    /* localStorage no disponible */
  }
}

export function TerrainSearchBar({ value, isLoading, onSubmit }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigatedRef = useRef(false);

  const [query, setQuery] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const [open, setOpen] = useState(false);
  const [recents, setRecents] = useState<string[]>(() => loadRecentSearches());

  if (value !== prevValue) {
    setPrevValue(value);
    setQuery(value);
  }

  const trimmed = query.trim();
  const debouncedQuery = useDebounce(trimmed, 300);
  const searchKey = trimmed.length >= 2 ? debouncedQuery : "";

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        navigatedRef.current = false;
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const suggestFilters = searchKey ? { search: searchKey } : { ordering: "recientes" };

  const { data, isFetching } = useQuery({
    queryKey: ["terrenos", suggestFilters, 1],
    queryFn: () => fetchTerrenos(1, suggestFilters),
    enabled: open,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const results = useMemo(() => data?.results ?? [], [data]);
  const suggestions = useMemo(() => results.slice(0, MAX_SUGGESTIONS), [results]);

  const municipios = useMemo(() => {
    if (!trimmed) return [];
    const needle = trimmed.toLowerCase();
    const seen = new Set<string>();
    const found: string[] = [];
    for (const terreno of results) {
      const nombre = terreno.municipio;
      const key = nombre.toLowerCase();
      if (!key.includes(needle) || seen.has(key)) continue;
      seen.add(key);
      found.push(nombre);
      if (found.length === MAX_MUNICIPIOS) break;
    }
    return found;
  }, [results, trimmed]);

  const matchedRecents = useMemo(() => {
    if (!trimmed) return recents;
    const fuse = new Fuse(recents, { threshold: 0.4, ignoreLocation: true });
    return fuse.search(trimmed).map((match) => match.item);
  }, [recents, trimmed]);

  const commit = (next: string) => {
    const term = next.trim();
    if (term) {
      const updated = [
        term,
        ...recents.filter((item) => item.toLowerCase() !== term.toLowerCase()),
      ].slice(0, MAX_RECENT);
      setRecents(updated);
      persistRecentSearches(updated);
    }
    onSubmit(term);
    setOpen(false);
    navigatedRef.current = false;
  };

  const openTerreno = (terreno: Terreno) => {
    setOpen(false);
    navigatedRef.current = false;
    router.push(`/terrenos/${terreno.slug}`);
  };

  const clearQuery = () => {
    setQuery("");
    setOpen(true);
    onSubmit("");
    navigatedRef.current = false;
    inputRef.current?.focus();
  };

  const clearRecents = () => {
    setRecents([]);
    persistRecentSearches([]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      navigatedRef.current = false;
      return;
    }
    if (open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      navigatedRef.current = true;
      return;
    }
    if (event.key === "Enter" && trimmed && !navigatedRef.current) {
      event.preventDefault();
      commit(trimmed);
    }
  };

  const focusInput = () => inputRef.current?.focus();

  const showSkeleton = isFetching && !data;
  const hasContent =
    matchedRecents.length > 0 || suggestions.length > 0 || municipios.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <Command
        loop
        shouldFilter={false}
        label="Buscar terrenos por zona o municipio"
        onKeyDown={handleKeyDown}
      >
        <div
          className={cn(
            "group flex items-center gap-2 rounded-[1.75rem] border bg-white/85 px-2 py-2 shadow-[0_2px_16px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-all duration-300",
            "border-line/60 focus-within:border-cta/40 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(209,154,61,0.13),0_18px_44px_rgba(15,23,42,0.10)]",
          )}
        >
          <span
            onClick={focusInput}
            className="grid h-11 w-11 flex-shrink-0 cursor-text place-items-center rounded-full bg-sand text-stone transition-colors group-focus-within:bg-cta/10 group-focus-within:text-cta-dark"
          >
            <Search className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1 px-1" onClick={focusInput}>
            <span
              aria-hidden="true"
              className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-stone/50 sm:block"
            >
              Zona o municipio
            </span>
            <Command.Input
              ref={inputRef}
              value={query}
              onValueChange={(next) => {
                setQuery(next);
                setOpen(true);
                navigatedRef.current = false;
              }}
              onFocus={() => {
                setOpen(true);
                navigatedRef.current = false;
              }}
              placeholder="¿Dónde buscas tu terreno?"
              className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:font-normal placeholder:text-stone/50"
            />
          </div>

          <AnimatePresence initial={false}>
            {query && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.15 }}
                onClick={clearQuery}
                aria-label="Limpiar búsqueda"
                className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-stone transition hover:bg-sand hover:text-ink"
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>

          <div className="mx-1 hidden h-8 w-px flex-shrink-0 bg-line/70 sm:block" />

          <button
            type="button"
            onClick={() => commit(query)}
            aria-label="Buscar terrenos"
            className="flex flex-shrink-0 items-center gap-2 rounded-full bg-gradient-to-br from-cta to-cta-dark px-4 py-3 text-sm font-bold text-text shadow-[0_8px_20px_rgba(209,154,61,0.35)] transition hover:brightness-105 active:scale-95 sm:px-5"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Buscar</span>
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.985 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className="absolute inset-x-0 top-[calc(100%+10px)] z-50 origin-top overflow-hidden rounded-3xl border border-line/60 bg-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl"
            >
              <Command.List className="max-h-[min(68vh,420px)] overflow-y-auto p-2">
                {trimmed && (
                  <div className="mb-1">
                    <Command.Item
                      value={`free:${trimmed}`}
                      onSelect={() => commit(trimmed)}
                      className={itemClasses}
                    >
                      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-ink/5 text-ink">
                        <Search className="h-4 w-4" />
                      </span>
                      <span className="truncate">
                        Buscar{" "}
                        <span className="font-semibold text-ink">“{trimmed}”</span>
                      </span>
                      <kbd className="ml-auto hidden rounded-md border border-line bg-sand px-1.5 py-0.5 text-[10px] font-bold text-stone sm:block">
                        Enter
                      </kbd>
                    </Command.Item>
                  </div>
                )}

                {showSkeleton ? (
                  <div className="space-y-1 p-1" aria-hidden="true">
                    {[0, 1, 2].map((row) => (
                      <div
                        key={row}
                        className="flex animate-pulse items-center gap-3 rounded-2xl px-3 py-2.5"
                      >
                        <div className="h-11 w-11 flex-shrink-0 rounded-xl bg-sand" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="h-3 w-1/2 rounded-full bg-sand" />
                          <div className="h-3 w-1/4 rounded-full bg-sand/70" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {matchedRecents.length > 0 && (
                      <div className="mb-1">
                        <div className="flex items-center justify-between px-3 pb-1 pt-2">
                          <span className={sectionLabel}>Búsquedas recientes</span>
                          <button
                            type="button"
                            onClick={clearRecents}
                            className="flex items-center gap-1 text-[11px] font-semibold text-stone/60 transition hover:text-ink"
                          >
                            <Trash2 className="h-3 w-3" />
                            Limpiar
                          </button>
                        </div>
                        {matchedRecents.map((term) => (
                          <Command.Item
                            key={term}
                            value={`recent:${term}`}
                            onSelect={() => commit(term)}
                            className={itemClasses}
                          >
                            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-sand text-stone">
                              <Clock className="h-4 w-4" />
                            </span>
                            <span className="truncate">{term}</span>
                          </Command.Item>
                        ))}
                      </div>
                    )}

                    {(suggestions.length > 0 || municipios.length > 0) && (
                      <div className="mb-1">
                        <div className="flex items-center gap-2 px-3 pb-1 pt-2">
                          <span className={sectionLabel}>
                            {trimmed ? "Sugerencias" : "Terrenos recientes"}
                          </span>
                          {isFetching && (
                            <Loader2 className="h-3 w-3 animate-spin text-stone/40" />
                          )}
                        </div>

                        {municipios.map((municipio) => (
                          <Command.Item
                            key={`muni:${municipio}`}
                            value={`muni:${municipio}`}
                            onSelect={() => commit(municipio)}
                            className={itemClasses}
                          >
                            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-cta/10 text-cta-dark">
                              <MapPin className="h-4 w-4" />
                            </span>
                            <span className="truncate">
                              Buscar en{" "}
                              <span className="font-semibold text-ink">{municipio}</span>
                            </span>
                          </Command.Item>
                        ))}

                        {suggestions.map((terreno) => (
                          <Command.Item
                            key={terreno.id}
                            value={`terreno:${terreno.id}`}
                            onSelect={() => openTerreno(terreno)}
                            className={itemClasses}
                          >
                            <span className="relative block h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl bg-sand">
                              {terreno.image ? (
                                <Image
                                  src={terreno.image}
                                  alt=""
                                  fill
                                  sizes="44px"
                                  className="object-cover"
                                />
                              ) : (
                                <span className="grid h-full w-full place-items-center text-stone/40">
                                  <MapPin className="h-4 w-4" />
                                </span>
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-ink">
                                {terreno.title}
                              </span>
                              <span className="block truncate text-xs text-stone">
                                {terreno.municipio}, {terreno.estado} · {terreno.areaLabel}
                              </span>
                            </span>
                            <span className="hidden shrink-0 text-sm font-bold text-primary sm:block">
                              {terreno.priceLabel}
                            </span>
                          </Command.Item>
                        ))}
                      </div>
                    )}

                    {!trimmed && !hasContent && (
                      <div className="px-4 py-7 text-center text-sm text-stone">
                        Escribe un municipio o zona para explorar terrenos
                      </div>
                    )}
                  </>
                )}
              </Command.List>

              <div className="hidden items-center justify-center gap-4 border-t border-line/60 bg-sand/60 px-4 py-2 text-[11px] font-medium text-stone/70 sm:flex">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-line bg-white px-1 py-0.5 text-[10px] font-bold">
                    ↑
                  </kbd>
                  <kbd className="rounded border border-line bg-white px-1 py-0.5 text-[10px] font-bold">
                    ↓
                  </kbd>
                  navegar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-line bg-white px-1.5 py-0.5 text-[10px] font-bold">
                    Enter
                  </kbd>
                  seleccionar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-line bg-white px-1.5 py-0.5 text-[10px] font-bold">
                    Esc
                  </kbd>
                  cerrar
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Command>
    </div>
  );
}
