import { MetadataRoute } from "next";

export const revalidate = 3600;

type TerrenoListItem = {
  slug?: string;
  updated_at?: string;
  created_at?: string;
};

function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
  return base.replace(/\/+$/, "");
}

async function fetchTerrenoEntries(siteUrl: string): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const maxPages = 50;
  let url: string | null = `${getApiBaseUrl()}/terrenos/?ordering=-created_at`;
  let pages = 0;

  while (url && pages < maxPages) {
    try {
      const response: Response = await fetch(url, { next: { revalidate: 3600 } });
      if (!response.ok) break;

      const data: { results?: TerrenoListItem[]; next?: string | null } = await response.json();
      const results: TerrenoListItem[] = Array.isArray(data?.results) ? data.results : [];

      for (const terreno of results) {
        if (!terreno.slug) continue;
        entries.push({
          url: `${siteUrl}/terrenos/${terreno.slug}`,
          lastModified: new Date(terreno.updated_at ?? terreno.created_at ?? Date.now()),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }

      url = data.next ?? null;
      pages += 1;
    } catch {
      // API inaccesible (p. ej. en build local) — devolvemos solo las páginas estáticas
      break;
    }
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://terrify.mx";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/guia-legal`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/publicar`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  const terrenoEntries = await fetchTerrenoEntries(baseUrl);

  return [...staticPages, ...terrenoEntries];
}
