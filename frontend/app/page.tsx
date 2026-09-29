import { Suspense } from "react";

import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { TerrainBrowser } from "@/components/terrain-browser";
import { fetchTerrenos } from "@/lib/api";
import type { Terreno } from "@/lib/types";
import { HomeSkeleton } from "@/components/home-ui";

export const revalidate = 60;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-sand pb-24 md:pb-0">
      <SiteHeader />
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </main>
  );
}

async function HomeContent() {
  let terrenos: Terreno[] = [];
  let hasNextPage = false;
  let totalTerrenos = 0;
  let apiFailed = false;

  try {
    const response = await fetchTerrenos();
    terrenos = response.results || [];
    hasNextPage = !!response.next;
    totalTerrenos = response.count ?? 0;
  } catch {
    apiFailed = true;
  }

  return (
    <>
      {/* Bloque 1 — Hero */}
      <section className="w-full bg-sand pt-10 pb-8 sm:pt-14 sm:pb-10">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h1 className="font-display text-[2.2rem] font-bold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[3rem] lg:text-[3.5rem]">
            Encuentra tu terreno ideal<br />
            <span className="text-cta">en Jalisco</span>
          </h1>
          
          <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-relaxed text-stone sm:text-lg">
            Explora sin registrarte. Contacta directo al vendedor.
          </p>
        </div>
      </section>

      {/* Bloque 2 — Listado */}
      <section id="listado" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {apiFailed ? (
          <EmptyState
            message="No pudimos cargar el listado."
            description="Refresca la página en unos momentos."
          />
        ) : (
          <TerrainBrowser
            initialTerrenos={terrenos}
            initialHasNextPage={hasNextPage}
            initialCount={totalTerrenos}
          />
        )}
      </section>
    </>
  );
}
