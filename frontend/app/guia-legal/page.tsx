import { SiteHeader } from "@/components/site-header";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guía Legal Antifraude para Terrenos en Jalisco | Terrify",
  description: "Protege tu inversión con nuestra guía jurídica gratuita. Descubre qué documentos pedir y cómo evitar estafas al comprar un terreno en México.",
};

export default function GuiaLegalPage() {
  return (
    <main className="min-h-screen relative bg-sand selection:bg-cta/20">
      <SiteHeader />

      {/* Decorative Orbs */}
      <div className="fixed inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-[100px] opacity-40" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-cta to-[#ffb88c] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-24 pt-12 sm:px-6 lg:px-8">
        
        {/* Header Hero */}
        <div className="text-center mb-16 rise-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-cta/20 bg-cta/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-cta shadow-sm mb-6">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            Inversión Segura
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-6xl mb-6">
            Guía jurídica para no perder tu dinero.
          </h1>
          <p className="max-w-2xl mx-auto text-lg leading-relaxed text-stone font-medium">
            Comprar un terreno es una gran decisión. Nuestra plataforma está diseñada para conectar compradores con vendedores verificados, pero como experto legal, te comparto <strong className="text-ink">los 5 mandamientos</strong> que debes exigirle a cualquier vendedor en Jalisco antes de soltar un solo peso.
          </p>
        </div>

        {/* Bento Grid Content */}
        <div className="grid gap-6 sm:gap-8 rise-in" style={{ animationDelay: '100ms' }}>
          
          <div className="group rounded-[2.5rem] border border-white/50 bg-white/70 p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all hover:bg-white/90">
            <div className="flex items-start gap-6">
              <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#30b56b]/10 text-[#30b56b]">
                 <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold uppercase tracking-widest text-[#30b56b] mb-2">1. La prueba reina</p>
                <h2 className="text-2xl font-bold text-ink mb-4">La Escritura Pública Inscrita</h2>
                <p className="text-stone leading-relaxed">
                  Muchos vendedores te dirán <em className="text-ink">&ldquo;solo tengo contrato privado&rdquo;</em> o <em className="text-ink">&ldquo;está en proceso&rdquo;</em>. Para que un terreno en Jalisco sea 100% tuyo sin riesgos legales inmediatos, el vendedor **debe** tener una Escritura Pública y estar inscrita en el <strong>Registro Público de la Propiedad (RPP)</strong> del estado.
                </p>
                <div className="mt-4 rounded-xl bg-sand/50 p-4 border border-line/50">
                  <p className="text-sm font-medium text-stone"><strong className="text-ink">Tip de abogado:</strong> Pide ver la escritura y cruza el nombre de quien firma con su INE original. Si el nombre no hace match perfecto, detén la compra y acude con un Notario.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="group rounded-[2.5rem] border border-white/50 bg-white/70 p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all hover:bg-white/90">
              <div className="flex gap-4 items-center mb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                </div>
                <h2 className="text-xl font-bold text-ink flex-1">Certificado de Libertad de Gravamen</h2>
              </div>
              <p className="text-stone leading-relaxed text-sm">
                Aunque la escritura esté bien, el terreno podría estar embargado, hipotecado o tener problemas legales. Este documento oficial te confirma que el lote está limpio de deudas y listo para venderse.
              </p>
            </div>

            <div className="group rounded-[2.5rem] border border-white/50 bg-white/70 p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all hover:bg-white/90">
              <div className="flex gap-4 items-center mb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <h2 className="text-xl font-bold text-ink flex-1">Pagos Municipales (Predial)</h2>
              </div>
              <p className="text-stone leading-relaxed text-sm">
                Exige el recibo del <strong>Impuesto Predial</strong> pagado al año corriente por el Ayuntamiento (ej. Zapopan, Tlajomulco, Chapala). Un terreno con deudas de predial no puede firmarse ante Notario, generarás multas y recargos.
              </p>
            </div>
          </div>

          <div className="group rounded-[2.5rem] border border-danger/20 bg-danger/5 p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all">
            <div className="flex items-start gap-6">
              <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-danger/20 text-danger">
                 <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold uppercase tracking-widest text-danger mb-2">Terrenos Ejidales</p>
                <h2 className="text-2xl font-bold text-ink mb-4">Cuidado con el <i>&ldquo;Certificado Parcelario&rdquo;</i></h2>
                <p className="text-stone leading-relaxed">
                  En Jalisco (sobre todo en zonas foráneas), abunda la venta de terrenos ejidales. Legalmente, la tierra ejidal <strong>NO se compra ni se vende, se ceden los derechos agrarios</strong> y no le puedes poner una escritura privada (a menos que tenga dominio pleno otorgado por el RAM).
                </p>
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                   <div className="rounded-xl border border-line bg-white/60 p-4">
                     <p className="text-xs font-bold uppercase text-ink line-through opacity-60">Incorrecto</p>
                     <p className="text-sm text-stone mt-1">Comprar un terreno ejidal firmando un contrato privado hecho por el vendedor. Si algo pasa, no eres el dueño ante la ley civil.</p>
                   </div>
                    <div className="rounded-xl border border-danger bg-white p-4 shadow-sm">
                      <p className="text-xs font-bold uppercase text-danger">Correcto</p>
                     <p className="text-sm text-stone mt-1">Acudir a la asamblea del ejido, verificar el certificado parcelario y hacer el trámite de &ldquo;Cesión de Derechos&rdquo; con el comisariado ejidal.</p>
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-ink p-10 sm:p-14 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10 blur-[80px]">
              <div className="w-64 h-64 bg-white rounded-full"></div>
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-4">Nunca des &ldquo;apartados&rdquo; sin notario.</h2>
                <p className="text-white/80 font-medium">
                  El fraude inmobiliario #1 en México es el de pedir adelantos. Si vas a amarrar un trato, <strong>háganlo firmando un &ldquo;Contrato de Promesa de Compraventa&rdquo;</strong>, de preferencia ratificado ante un Notario Público del Estado.
                </p>
              </div>
              <Link href="/" className="shrink-0 flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-ink transition-all hover:scale-105 active:scale-95 shadow-[0_10px_20px_rgba(0,0,0,0.15)]">
                Empezar a buscar
              </Link>
            </div>
          </div>

          {/* Expertos / Instituciones */}
          <div className="grid gap-6 md:grid-cols-3 mt-6">
            <div className="col-span-full mb-2">
              <h2 className="text-3xl font-bold text-ink">¿Con quién acudir para estar seguro?</h2>
              <p className="text-stone">Las instituciones y expertos clave en Jalisco a los que debes recurrir antes de comprar.</p>
            </div>
            
            <div className="group rounded-[2rem] border border-white/60 bg-white/60 p-8 shadow-sm backdrop-blur-md transition hover:border-cta/20 hover:shadow-md">
              <div className="mb-4 h-12 w-12 rounded-xl bg-ink text-white flex items-center justify-center">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              </div>
              <h3 className="font-bold text-ink text-lg mb-2">Un Notario Público (Activo)</h3>
              <p className="text-sm text-stone">Ellos tienen fe pública. Antes de dar un enganche, lleva copias de la escritura al notario de tu confianza. Confirma notarios certificados en el portal del <strong>Colegio de Notarios del Estado de Jalisco</strong>.</p>
            </div>

            <div className="group rounded-[2rem] border border-white/60 bg-white/60 p-8 shadow-sm backdrop-blur-md transition hover:border-cta/20 hover:shadow-md">
              <div className="mb-4 h-12 w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <h3 className="font-bold text-ink text-lg mb-2">Oficinas de Gobierno</h3>
              <p className="text-sm text-stone">El <strong>Registro Público de la Propiedad y de Comercio (RPPC)</strong> para revisar que el terreno no esté hipotecado, y el <strong>Catastro Municipal</strong> (Zapopan, Guadalajara, etc.) para rectificar deuda de predial e historial.</p>
            </div>

            <div className="group rounded-[2rem] border border-white/60 bg-white/60 p-8 shadow-sm backdrop-blur-md transition hover:border-cta/20 hover:shadow-md">
              <div className="mb-4 h-12 w-12 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h3 className="font-bold text-ink text-lg mb-2">Delegaciones Agrarias</h3>
              <p className="text-sm text-stone">Para ejidos (muy común). Acude a la <strong>Procuraduría Agraria (PA)</strong> o al <strong>Registro Agrario Nacional (RAN)</strong>. Ellos certifican si el vendedor de verdad es el titular de los derechos ejidales.</p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
