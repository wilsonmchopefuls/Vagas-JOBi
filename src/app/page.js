import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]/route';
import { bootstrapAdmin } from '../services/job.service';
import { BRAND } from '../lib/brand';
import Link from 'next/link';
import s from './landing.module.css';

export const metadata = {
  title: 'Trampo — Mural de Vagas e Oportunidades para Comunidades Discord',
  description: 'Publique vagas de emprego e serviços freelancer direto no seu servidor Discord. Grátis, open source, pronto para usar em qualquer nicho.',
  alternates: { canonical: process.env.NEXTAUTH_URL ?? 'https://trampo.vercel.app' },
  openGraph: {
    title: 'Trampo — Mural de Vagas para Discord',
    description: 'Plataforma open source de vagas e freelancers integrada ao Discord.',
    type: 'website',
    url: process.env.NEXTAUTH_URL,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Trampo — Mural de Vagas' }],
  },
};

const FEATURES = [
  { icon: '⚡', title: 'Direto no Discord', desc: 'Publicações aparecem automaticamente no canal configurado. Sem copiar e colar.' },
  { icon: '🎨', title: 'Totalmente Customizável', desc: 'Troque cores, fundos, categorias e muito mais pelo painel de admin.' },
  { icon: '🔒', title: 'Seguro por Padrão', desc: 'OAuth2 oficial do Discord. Zero senhas, proteção contra CSRF, SSRF e injeção.' },
  { icon: '🌐', title: 'Qualquer Nicho', desc: 'TI, design, direito, marketing. As categorias do formulário são 100% editáveis.' },
  { icon: '🚀', title: 'Deploy em 5 minutos', desc: 'Vercel + Neon PostgreSQL. Setup Wizard guiado sem editar arquivo nenhum.' },
  { icon: '📋', title: 'Moderação integrada', desc: 'Painel de admin para aprovar, rejeitar e gerenciar vagas e freelancers.' },
];

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  let isAdminUser = false;
  if (session?.user?.id) {
    isAdminUser = await bootstrapAdmin(session.user.id);
  }

  return (
    <main className={s.page}>
      {/* Admin bar */}
      {isAdminUser && (
        <div className={s.adminBar}>
          <span>🛡️ Olá, Moderador!</span>
          <Link href="/admin" className={s.adminBarBtn}>Acessar Painel →</Link>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className={s.hero}>
        <div className={s.heroBadge}>
          <span className={s.heroBadgeDot} />
          Plataforma Open Source
        </div>

        <h1 className={s.heroTitle}>
          O mural de vagas que o seu{' '}
          <span className={s.heroAccent}>servidor Discord</span>{' '}
          merecia.
        </h1>

        <p className={s.heroLead}>
          Trampo conecta empresas, talentos e freelancers diretamente na sua comunidade.
          Sem formulários externos, sem burocracia. Tudo num clique.
        </p>

        <div className={s.heroCta}>
          <Link href="/publicar" className={s.ctaPrimary}>
            💼 Publicar Oportunidade
          </Link>
          <a
            href={BRAND.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={s.ctaSecondary}
            title="Acessar o repositório no GitHub para instalar"
          >
            ⬇ Baixar no GitHub
          </a>
        </div>

        <p className={s.heroNote}>
          Grátis para sempre · Open Source · OAuth2 Discord
        </p>

      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className={s.features} aria-labelledby="features-title">
        <h2 id="features-title" className={s.sectionTitle}>
          Por que usar o Trampo?
        </h2>
        <div className={s.featureGrid}>
          {FEATURES.map((f) => (
            <article key={f.title} className={s.featureCard}>
              <div className={s.featureIcon} aria-hidden="true">{f.icon}</div>
              <h3 className={s.featureTitle}>{f.title}</h3>
              <p className={s.featureDesc}>{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── CTA Final ────────────────────────────────────────────── */}
      <section className={s.ctaSection} aria-labelledby="cta-title">
        <h2 id="cta-title" className={s.ctaTitle}>Pronto para começar?</h2>
        <p className={s.ctaDesc}>
          Você pode usar agora mesmo ou instalar no seu servidor.
        </p>
        <div className={s.ctaRow}>
          <Link href="/publicar" className={s.ctaPrimary}>
            Publicar uma Oportunidade
          </Link>
          <Link href="/sobre" className={s.ctaPrimary}>
            Saiba Mais →
          </Link>
        </div>
      </section>
    </main>
  );
}
