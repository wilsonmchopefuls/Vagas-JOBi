import styles from '../page.module.css';
import JobForm from '../../components/JobForm';
import AdBanner from '../../components/AdBanner';

export const metadata = {
  title: 'Publicar Oportunidade — Trampo',
  description: 'Publique uma vaga de emprego ou ofereça seu serviço freelancer na comunidade Discord.',
  robots: { index: false }, // não indexa a página de formulário
};

export default function PublicarPage() {
  return (
    <main className={styles.main} style={{ paddingTop: '64px' }}>
      {/* Banner de anúncio horizontal — topo do conteúdo */}
      <AdBanner variant="horizontal" />

      <div className={styles.badge}>
        <span className={styles.badgeDot} />
        Publicar Oportunidade
      </div>

      <div className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>💼</div>
          <span className={styles.logoText}>Trampo<span>.</span></span>
        </div>
        <h1 className={styles.title}>Mural de Oportunidades</h1>
        <p className={styles.subtitle}>
          Encontre ou anuncie vagas e serviços diretamente na nossa comunidade do Discord.
        </p>
      </div>

      <div className={styles.card}>
        <JobForm />
      </div>

      <p className={styles.footer}>
        As postagens são publicadas automaticamente no servidor do Discord após aprovação.
      </p>
    </main>
  );
}
