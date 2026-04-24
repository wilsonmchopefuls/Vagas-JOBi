/**
 * robots.js — Next.js gera /robots.txt automaticamente.
 */
export default function robots() {
  const base = process.env.NEXTAUTH_URL ?? 'https://trampo.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/sobre', '/publicar'],
        disallow: ['/admin', '/api/', '/setup'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
