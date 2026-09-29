import Link from "next/link";

const footerGroups = [
  {
    title: "Explora",
    links: [
      { href: "/#listado", label: "Explorar terrenos" },
      { href: "/", label: "Terrenos destacados" },
      { href: "/login", label: "Iniciar sesion" },
    ],
  },
  {
    title: "Vende tu terreno",
    links: [
      { href: "/publicar", label: "Publicar un terreno" },
      { href: "/publicar", label: "Administrar anuncios" },
      { href: "/publicar", label: "Revisar contactos" },
    ],
  },
  {
    title: "Terrify",
    links: [
      { href: "/", label: "Como funciona" },
      { href: "/#listado", label: "Terrenos disponibles" },
      { href: "/", label: "Compra y venta de terrenos" },
    ],
  },
];

const legalLinks = [
  { href: "/", label: "Privacidad" },
  { href: "/", label: "Terminos" },
  { href: "/", label: "Informacion de la compania" },
];

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-line/70 bg-[#f6f2ec]">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 md:pb-10 lg:px-8">
        <div className="grid gap-8 border-b border-line/70 pb-8 sm:grid-cols-2 lg:grid-cols-3">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-semibold text-ink">{group.title}</h2>
              <div className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <Link
                    key={`${group.title}-${link.label}`}
                    href={link.href}
                    className="block text-sm leading-6 text-stone transition hover:text-ink"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 pt-5 text-sm text-stone lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span>{`© ${currentYear} Terrify`}</span>
            {legalLinks.map((link, index) => (
              <div key={link.label} className="flex items-center gap-3">
                <span className="text-stone/60">{index === 0 ? "·" : "·"}</span>
                <Link href={link.href} className="transition hover:text-ink">
                  {link.label}
                </Link>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-line/80 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink">
              Espanol (MX)
            </span>
            <span className="rounded-full border border-line/80 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink">
              MXN
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
