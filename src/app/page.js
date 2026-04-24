import styles from "./page.module.css";
import JobForm from "../components/JobForm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { bootstrapAdmin } from "../services/job.service";
import Link from "next/link";

export const metadata = {
  title: "Trampo — Mural de Oportunidades",
  description: "Plataforma de vagas e freelancers da comunidade. Conectando empresas e talentos.",
};

export default async function Home() {
  const session = await getServerSession(authOptions);
  let isAdminUser = false;

  if (session?.user?.id) {
    isAdminUser = await bootstrapAdmin(session.user.id);
  }

  return (
    <main className={styles.main}>
      {isAdminUser && (
        <div className={styles.adminTopBar}>
          <div className={styles.adminTopBarInner}>
            <span>🛡️ Olá, Moderador! Você tem acesso ao painel de controle.</span>
            <Link href="/admin" className={styles.adminTopBarBtn}>
              Acessar Painel
            </Link>
          </div>
        </div>
      )}

      <div className={styles.badge}>
        <span className={styles.badgeDot} />
        Oportunidades na comunidade
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
