import prisma from '../../lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { bootstrapAdmin } from "../../services/job.service";
import styles from "./admin.module.css";

import AdminManager from "../../components/AdminManager";
import Link from "next/link";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return (
      <div className={styles.deniedWrap}>
        <div className={styles.deniedIcon}>🔒</div>
        <h2 className={styles.deniedTitle}>Acesso Negado</h2>
        <p className={styles.deniedSub}>Faça login para continuar.</p>
      </div>
    );
  }

  const discordId = session.user.id;

  // Bootstrap + verificação de permissão (via service)
  const hasAccess = await bootstrapAdmin(discordId);
  if (!hasAccess) {
      return (
        <div className={styles.deniedWrap}>
          <div className={styles.deniedIcon}>⛔</div>
          <h2 className={styles.deniedTitle}>Sem Permissão de RH</h2>
          <p className={styles.deniedSub}>
            Seu ID do Discord <strong style={{ color: "#f4f4f5" }}>({discordId})</strong> não está na lista de administradores.
          </p>
        </div>
      );
  }

  // Verificar se o admin logado é ROOT
  const adminProfile = await prisma.admin.findUnique({ where: { discordId } });
  const isRoot = adminProfile?.addedBy === "SYSTEM";

  const pendingJobs = await prisma.jobPost.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" }
  });

  // Buscar todos os admins e cruzar com a tabela de usuários
  const rawAdmins = await prisma.admin.findMany();
  const userIds = rawAdmins.map(a => a.discordId);
  const users = await prisma.user.findMany({ where: { discordId: { in: userIds } } });
  
  const allAdmins = rawAdmins.map(admin => {
    const user = users.find(u => u.discordId === admin.discordId);
    return { ...admin, user };
  });

  return (
    <div className={styles.adminMain}>

      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Link href="/" className={styles.backBtn}>
          ← Voltar para a Tela Inicial
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link href="/admin/form-config" className={styles.formConfigBtn}>
            📋 Configurar Formulário
          </Link>
          {isRoot && (
            <Link href="/admin/theme-editor" className={styles.themeEditorBtn}>
              🎨 Editor de Temas
            </Link>
          )}
        </div>
      </div>

      <div className={styles.adminHeader}>
        <h1 className={styles.adminTitle}>Painel de <span>Moderação</span></h1>
        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Logado como <strong style={{ color: "var(--text)" }}>{session.user.name}</strong>
          {isRoot && <span style={{ marginLeft: "0.5rem", padding: "0.15rem 0.5rem", background: "rgba(220,38,38,0.2)", color: "#f87171", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold" }}>ROOT</span>}
        </span>
      </div>

      {/* Promover RH / Gerenciar Equipe (Só Root vê) */}
      <AdminManager allAdmins={allAdmins} isRoot={isRoot} />

      {/* Vagas Pendentes */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>
          ⏳ Vagas Pendentes ({pendingJobs.length})
        </p>

        {pendingJobs.length === 0 ? (
          <div className={styles.emptyState}>
            ✅ Nenhuma vaga aguardando aprovação no momento.
          </div>
        ) : (
          <div className={styles.adminList}>
            {pendingJobs.map((job) => {
              let payload;
              try {
                payload = JSON.parse(job.payload);
              } catch {
                // Payload corrompido — exibe card de erro em vez de quebrar a página
                return (
                  <div key={job.id} className={styles.jobCard}>
                    <p className={styles.jobCardTitle} style={{ color: '#f87171' }}>
                      ⚠️ Postagem com dados corrompidos (ID: {job.id})
                    </p>
                  </div>
                );
              }
              return (
                <div key={job.id} className={styles.jobCard}>
                  <p className={styles.jobCardTitle}>
                    {payload.title}{payload.company ? ` — ${payload.company}` : ""}
                  </p>
                  <p className={styles.jobCardMeta}>
                    por &lt;@{job.discordId}&gt; · {new Date(job.createdAt).toLocaleDateString("pt-BR")}
                    {payload.level ? ` · ${payload.level}` : ""}
                    {payload.regime ? ` · ${payload.regime}` : ""}
                  </p>
                  <div className={styles.jobCardDesc}>
                    {payload.description || payload.skills}
                  </div>
                  <div className={styles.jobCardActions}>
                    <form action="/api/admin/action" method="POST">
                      <input type="hidden" name="id" value={job.id} />
                      <input type="hidden" name="action" value="APPROVE" />
                      <button type="submit" className={styles.btnApprove}>✅ Aprovar</button>
                    </form>
                    <form action="/api/admin/action" method="POST">
                      <input type="hidden" name="id" value={job.id} />
                      <input type="hidden" name="action" value="REJECT" />
                      <button type="submit" className={styles.btnReject}>❌ Rejeitar</button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
