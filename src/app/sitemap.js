/**
 * sitemap.js — Next.js gera /sitemap.xml automaticamente.
 * Rotas privadas (admin, api, setup) são excluídas.
 */
export default function sitemap() {
  const base = process.env.NEXTAUTH_URL ?? 'https://trampo.vercel.app';

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${base}/sobre`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${base}/publicar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];
}
