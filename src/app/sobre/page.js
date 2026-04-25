import { BRAND } from '../../lib/brand';
import s from './sobre.module.css';
import GifPortrait from './GifPortrait';


export const metadata = {
  title: 'Sobre o Trampo — Plataforma de Vagas para Discord',
  description: `Conheça o Trampo: a plataforma open source criada por ${BRAND.founderName} que conecta vagas de emprego e freelancers diretamente em servidores Discord.`,
  alternates: { canonical: `${process.env.NEXTAUTH_URL ?? 'https://trampo.vercel.app'}/sobre` },
  openGraph: {
    title: 'Sobre o Trampo',
    description: 'Plataforma open source de vagas e freelancers para Discord.',
    type: 'website',
  },
};


const DIFFERENTIALS = [
  {
    icon: '🔌',
    title: 'Integração nativa com Discord',
    text: 'Publicações disparam automaticamente no canal do seu servidor. Sem copiar, sem colar, sem burocracia.',
  },
  {
    icon: '🎨',
    title: 'Visual 100% customizável',
    text: 'Editor de temas com preview em tempo real. Mude cores, gradientes e fundos sem tocar no código.',
  },
  {
    icon: '🌐',
    title: 'Serve qualquer nicho',
    text: 'TI, design, direito, marketing. Campos do formulário editáveis pelo painel para o seu público.',
  },
  {
    icon: '🔒',
    title: 'Segurança real',
    text: 'Proteção contra CSRF, SSRF e injeção. OAuth2 do Discord. Nenhuma senha armazenada.',
  },
  {
    icon: '🚀',
    title: 'Deploy em minutos',
    text: 'Setup Wizard guiado. Vercel + Neon PostgreSQL. Sem editar arquivo de configuração.',
  },
  {
    icon: '❤️',
    title: 'Open Source para sempre',
    text: 'Gratuito, código aberto, sem lock-in. Instale, forke e adapte à sua comunidade.',
  },
];

export default function SobrePage() {
  // JSON_LD construído em runtime (dentro da função) para que
  // process.env.NEXTAUTH_URL seja resolvido na requisição, não no build.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Trampo',
    operatingSystem: 'Web',
    applicationCategory: 'BusinessApplication',
    author: {
      '@type': 'Person',
      name: BRAND.founderName,
      url: BRAND.founderLinkedin,
    },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
    url: process.env.NEXTAUTH_URL ?? 'https://trampo.vercel.app',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className={s.page}>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className={s.hero}>
          <div className={s.heroCopy}>
            <span className={s.eyebrow}>Sobre o Projeto</span>
            <h1 className={s.heroTitle}>
              O mural de vagas que a sua comunidade sempre precisou.
            </h1>
            <p className={s.heroLead}>
              <strong>Trampo</strong> é uma plataforma open source que transforma qualquer servidor Discord
              num quadro de vagas e freelancers completo — com moderação, temas visuais e formulário
              adaptável para qualquer nicho.
            </p>
          </div>

          {/* Foto/GIF do fundador */}
          <aside className={s.portrait}>
            <GifPortrait />
            <div className={s.founderInfo}>
              <span className={s.founderRole}>Criador &amp; Desenvolvedor</span>
              <strong className={s.founderName}>{BRAND.founderName}</strong>
              <div className={s.founderLinks}>
                <a
                  href={BRAND.founderGithub}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={s.founderLink}
                  aria-label="GitHub de Wilson Teofilo"
                >
                  <GithubIcon />
                  GitHub
                </a>
                <a
                  href={BRAND.founderLinkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={s.founderLink}
                  aria-label="LinkedIn de Wilson Teofilo"
                >
                  <LinkedinIcon />
                  LinkedIn
                </a>
              </div>
            </div>
          </aside>
        </section>

        {/* ── Diferenciais ─────────────────────────────────────── */}
        <section className={s.section} aria-labelledby="diff-title">
          <h2 id="diff-title" className={s.sectionTitle}>Por que o Trampo é diferente?</h2>
          <div className={s.diffGrid}>
            {DIFFERENTIALS.map((d) => (
              <article key={d.title} className={s.diffCard}>
                <span className={s.diffIcon} aria-hidden="true">{d.icon}</span>
                <h3 className={s.diffTitle}>{d.title}</h3>
                <p className={s.diffText}>{d.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section className={s.cta} aria-labelledby="cta-title">
          <h2 id="cta-title" className={s.ctaTitle}>Pronto para instalar ou começar a usar?</h2>
          <div className={s.ctaRow}>
            <a
              href={BRAND.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={s.ctaPrimary}
            >
              ⬇ Baixar no GitHub
            </a>
            <a
              href={BRAND.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={s.ctaPrimary}
            >
              Ver no GitHub →
            </a>
          </div>
        </section>

      </main>
    </>
  );
}

function GithubIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}
