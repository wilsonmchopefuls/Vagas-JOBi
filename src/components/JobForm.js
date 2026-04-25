"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import styles from "../app/page.module.css";
import { BRAND } from "../lib/brand";
import ThemeSelector from "./ThemeSelector";

// ─── SVG Icons ─────────────────────────────────────────────────────────────
const DiscordIcon = () => (
  <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="currentColor">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

// ─── Componente: Select com pesquisa ─────────────────────────────────────────
function SearchableSelect({ options, value, onChange, placeholder, allowOther = false }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [isOther, setIsOther] = useState(false);
  const [otherValue, setOtherValue] = useState('');
  const ref = useRef(null);

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase())).slice(0, 10);

  const select = (opt) => {
    if (opt === '__other__') {
      setIsOther(true);
      setOpen(false);
      setQuery('');
      onChange('');
    } else {
      setIsOther(false);
      onChange(opt);
      setQuery(opt);
      setOpen(false);
    }
  };

  if (isOther) {
    return (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          className="input-field"
          placeholder="Digite o nome..."
          value={otherValue}
          onChange={e => { setOtherValue(e.target.value); onChange(e.target.value); }}
          style={{ flex: 1 }}
          autoFocus
        />
        <button type="button" className="btn-ghost" style={{ flex: '0 0 auto', fontSize: '0.8rem' }}
          onClick={() => { setIsOther(false); setOtherValue(''); onChange(''); setQuery(''); }}>
          ← Voltar
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        type="text"
        className="input-field"
        placeholder={placeholder}
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); onChange(''); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
      />
      {open && (query.length > 0 || filtered.length > 0) && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)', maxHeight: '220px', overflowY: 'auto',
        }}>
          {filtered.map(opt => (
            <div key={opt} onMouseDown={() => select(opt)} style={{
              padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.9rem',
              borderBottom: '1px solid var(--border)',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-glow)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {opt}
            </div>
          ))}
          {allowOther && (
            <div onMouseDown={() => select('__other__')} style={{
              padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.85rem',
              color: 'var(--text-muted)', borderTop: '1px solid var(--border)',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              + Outra (digitar)
            </div>
          )}
          {filtered.length === 0 && !allowOther && (
            <div style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Nenhum resultado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Componente: Bloco de Formação ─────────────────────────────────────────
function EducationBlock({ idx, data, onChange, onRemove, config }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)', padding: '1rem', marginBottom: '0.75rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Formação {idx + 1}
        </span>
        {idx > 0 && (
          <button type="button" onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>
            ✕ remover
          </button>
        )}
      </div>

      <div className="input-group">
        <label className="input-label">Instituição</label>
        <SearchableSelect
          options={config?.edu_institutions || []}
          value={data.institution}
          onChange={v => onChange({ ...data, institution: v })}
          placeholder="Buscar faculdade..."
          allowOther={true}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="input-group" style={{ flex: 2 }}>
          <label className="input-label">Curso</label>
          <SearchableSelect
            options={config?.edu_courses || []}
            value={data.course}
            onChange={v => onChange({ ...data, course: v })}
            placeholder="Buscar curso..."
            allowOther={true}
          />
        </div>
        <div className="input-group" style={{ flex: 1 }}>
          <label className="input-label">Nível</label>
          <select className="input-field" value={data.level} onChange={e => onChange({ ...data, level: e.target.value })}>
            <option value="">Selecione...</option>
            {(config?.edu_levels || []).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div className="input-group" style={{ marginBottom: 0 }}>
        <label className="input-label">Status</label>
        <select className="input-field" value={data.status} onChange={e => onChange({ ...data, status: e.target.value })}>
          <option value="Cursando">Cursando</option>
          <option value="Concluído">Concluído</option>
          <option value="Trancado">Trancado</option>
        </select>
      </div>
    </div>
  );
}

// ─── Formulário Principal ─────────────────────────────────────────────────
const emptyEdu = () => ({ institution: '', course: '', level: '', status: 'Cursando' });

export default function JobForm() {
  const { data: session, status: authStatus } = useSession();
  const [activeTab, setActiveTab] = useState('vagas');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '', isPending: false });

  const [formConfig, setFormConfig] = useState(null);

  const [form, setForm] = useState({
    title: '', company: '', level: 'Júnior', regime: 'CLT',
    description: '', contact: '', skills: '', portfolio: '',
    availability: '',
  });

  const [educations, setEducations] = useState([emptyEdu()]);

  useEffect(() => {
    fetch('/api/form-config')
      .then(r => r.json())
      .then(data => {
        setFormConfig(data);
        setForm(f => ({ ...f, level: data.job_levels[0] || '', regime: data.job_regimes[0] || '' }));
      })
      .catch(console.error);
  }, []);

  const resetForm = () => {
    setForm({ title: '', company: '', level: formConfig?.job_levels[0] || '', regime: formConfig?.job_regimes[0] || '', description: '', contact: '', skills: '', portfolio: '', availability: '' });
    setEducations([emptyEdu()]);
    setStep(1);
    setFeedback({ type: '', message: '', isPending: false });
  };

  const switchTab = (tab) => { setActiveTab(tab); resetForm(); };
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addEducation = () => {
    if (educations.length < 3) setEducations([...educations, emptyEdu()]);
  };
  const updateEducation = (i, val) => setEducations(educations.map((e, idx) => idx === i ? val : e));
  const removeEducation = (i) => setEducations(educations.filter((_, idx) => idx !== i));

  // ─── Loading ───────────────────────────────────────────────────────────
  if (authStatus === 'loading') {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', animation: 'pulse 1.5s infinite' }}>Verificando sessão...</div>;
  }

  // ─── Login ──────────────────────────────────────────────────────────────
  if (authStatus === 'unauthenticated') {
    return (
      <div className={styles.loginWrap}>
        <div className={styles.loginIcon}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 className={styles.loginTitle}>Acesso Restrito</h2>
        <p className={styles.loginSub}>
          Faça login com sua conta do Discord para publicar vagas na{' '}
          <a
            href={BRAND.discordInvite}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.communityLink}
          >
            comunidade {BRAND.communityName}
          </a>
          .
        </p>
        <button type="button" className={styles.btnDiscord} onClick={() => signIn('discord')}>
          <DiscordIcon /> Entrar com Discord
        </button>
        <div className={styles.divider}>
          <div className={styles.dividerLine} />
          <span className={styles.dividerText}>GRATUITO E SEGURO</span>
          <div className={styles.dividerLine} />
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', lineHeight: 1.5 }}>
          OAuth2 oficial do Discord. Nunca acessamos sua senha ou mensagens.
        </p>
      </div>
    );
  }

  // ─── Loading formConfig ─────────────────────────────────────────────────
  if (!formConfig) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', animation: 'pulse 1.5s infinite' }}>Carregando formulário...</div>;
  }

  // ─── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 2) return setStep(2);

    setLoading(true);
    setFeedback({ type: '', message: '' });

    const payload = {
      type: activeTab,
      ...form,
      ...(activeTab === 'freelancers' ? { educations } : {}),
    };

    try {
      const res = await fetch('/api/discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        const isPending = data.message?.includes('aprovação') || data.message?.includes('limite');
        setFeedback({ type: 'success', message: data.message || 'Publicado com sucesso! 🎉', isPending });
        resetForm();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Erro ao publicar.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erro de conexão. Tente novamente.' });
    } finally { setLoading(false); }
  };

  // ─── Steps de Vaga ──────────────────────────────────────────────────────
  const renderVagaStep = () => {
    if (step === 1) return (
      <>
        <div className="input-group">
          <label className="input-label">Título da Vaga</label>
          <input required type="text" name="title" value={form.title} onChange={set} className="input-field" placeholder="Ex: Desenvolvedor Front-end React" />
        </div>
        <div className="input-group">
          <label className="input-label">Nome da Empresa</label>
          <input required type="text" name="company" value={form.company} onChange={set} className="input-field" placeholder="Ex: Rocketseat" />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">Nível</label>
            <select name="level" value={form.level} onChange={set} className="input-field">
              {(formConfig?.job_levels || []).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">Regime</label>
            <select name="regime" value={form.regime} onChange={set} className="input-field">
              {(formConfig?.job_regimes || []).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </>
    );

    return (
      <>
        <div className="input-group">
          <label className="input-label">Descrição Detalhada</label>
          <textarea required name="description" value={form.description} onChange={set} className="input-field" placeholder="Responsabilidades, requisitos, benefícios, faixa salarial..." style={{ minHeight: '130px' }} />
        </div>
        <div className="input-group">
          <label className="input-label">Canal de Contato</label>
          <input required type="text" name="contact" value={form.contact} onChange={set} className="input-field" placeholder="E-mail, link da Gupy, LinkedIn..." />
        </div>
      </>
    );
  };

  // ─── Steps de Freela ────────────────────────────────────────────────────
  const renderFreelaStep = () => {
    if (step === 1) return (
      <>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">Seu Nome</label>
            <input required type="text" name="company" value={form.company} onChange={set} className="input-field" placeholder="Como quer ser chamado" />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">Disponibilidade</label>
            <input type="text" name="availability" value={form.availability} onChange={set} className="input-field" placeholder="Ex: 20h/semana" />
          </div>
        </div>
        <div className="input-group">
          <label className="input-label">Especialidade / Título</label>
          <input required type="text" name="title" value={form.title} onChange={set} className="input-field" placeholder="Ex: Fullstack Node + React" />
        </div>
        <div className="input-group">
          <label className="input-label">Tech & Soft Skills</label>
          <textarea required name="skills" value={form.skills} onChange={set} className="input-field" placeholder="React, Node.js, TypeScript, comunicação..." style={{ minHeight: '90px' }} />
        </div>
      </>
    );

    return (
      <>
        <div className="input-group">
          <label className="input-label">Portfólio / Projetos</label>
          <input required type="text" name="portfolio" value={form.portfolio} onChange={set} className="input-field" placeholder="GitHub, Behance, LinkedIn..." />
        </div>
        <div className="input-group">
          <label className="input-label">Como entrar em contato</label>
          <input required type="text" name="contact" value={form.contact} onChange={set} className="input-field" placeholder="Discord, E-mail, WhatsApp..." />
        </div>

        {/* Formação Acadêmica */}
        <div style={{ marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <label className="input-label" style={{ margin: 0 }}>🎓 Formação Acadêmica (opcional)</label>
            {educations.length < 3 && (
              <button type="button" onClick={addEducation} className="btn-ghost" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
                + Adicionar
              </button>
            )}
          </div>
          {educations.map((edu, i) => (
            <EducationBlock
              key={i} idx={i} data={edu}
              config={formConfig}
              onChange={(val) => updateEducation(i, val)}
              onRemove={() => removeEducation(i)}
            />
          ))}
        </div>
      </>
    );
  };

  const stepLabels = activeTab === 'vagas'
    ? ['Empresa & Detalhes', 'Descrição & Contato']
    : ['Perfil & Skills', 'Contato & Formação'];

  return (
    <>
      {/* User bar */}
      <div className={styles.userBar}>
        <div className={styles.userInfo}>
          {session.user?.image && <img src={session.user.image} alt="avatar" className={styles.userAvatar} />}
          <span className={styles.userName}>{session.user?.name}</span>
          <span className={styles.userBadge}>Discord</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeSelector />
          <button type="button" className="btn-ghost" onClick={() => signOut({ callbackUrl: '/', redirect: true })} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>Sair</button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button type="button" className={`${styles.tabBtn} ${activeTab === 'vagas' ? styles.tabActive : ''}`} onClick={() => switchTab('vagas')}>
          💼 Publicar Vaga
        </button>
        <button type="button" className={`${styles.tabBtn} ${activeTab === 'freelancers' ? styles.tabActive : ''}`} onClick={() => switchTab('freelancers')}>
          🚀 Oferecer Serviço
        </button>
      </div>

      {/* Progress */}
      <div className={styles.stepsBar}>
        {[1, 2].map(i => (
          <div key={i} className={styles.stepSegment}>
            <div className={`${styles.stepSegmentFill} ${i <= step ? styles.active : ''}`} />
          </div>
        ))}
      </div>
      <p className={styles.stepLabel}>
        Passo <span>{step} de 2</span> — {stepLabels[step - 1]}
      </p>

      {/* Feedback Modal */}
      {feedback.message && (
        <div
          id="feedback-modal-overlay"
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
            animation: 'fadeIn 0.2s ease-out', padding: '1rem',
          }}
          onClick={e => { if (e.target.id === 'feedback-modal-overlay') setFeedback({ type: '', message: '', isPending: false }); }}
        >
          <div style={{
            background: 'var(--bg-card)',
            padding: '2.5rem 2rem 2rem',
            borderRadius: 'var(--r-lg)',
            border: `1px solid ${
              feedback.type === 'success'
                ? feedback.isPending ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'
                : 'rgba(239, 68, 68, 0.4)'
            }`,
            maxWidth: '420px', width: '100%', textAlign: 'center',
            boxShadow: `0 24px 48px rgba(0,0,0,0.6), 0 0 60px ${
              feedback.type === 'success'
                ? feedback.isPending ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)'
                : 'rgba(239, 68, 68, 0.08)'
            }`,
            animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            position: 'relative',
          }}>

            {/* Botão fechar (X) */}
            <button
              type="button"
              id="feedback-modal-close"
              onClick={() => setFeedback({ type: '', message: '', isPending: false })}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%', width: '28px', height: '28px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem',
                lineHeight: 1, transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              aria-label="Fechar"
            >
              ✕
            </button>

            {/* Ícone principal */}
            <div style={{
              marginBottom: '1.25rem',
              color: feedback.type === 'success'
                ? feedback.isPending ? '#f59e0b' : '#10b981'
                : '#ef4444',
            }}>
              {feedback.type === 'success' ? (
                feedback.isPending ? (
                  /* Ícone relógio — pendente de aprovação */
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', display: 'block' }}>
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                ) : (
                  /* Ícone check — publicado! */
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', display: 'block' }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                )
              ) : (
                /* Ícone erro */
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', display: 'block' }}>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              )}
            </div>

            {/* Título */}
            <h3 style={{ marginBottom: '0.6rem', color: '#fff', fontSize: '1.45rem', fontWeight: 700, lineHeight: 1.2 }}>
              {feedback.type === 'success'
                ? feedback.isPending ? 'Enviado para aprovação! ⏳' : 'Publicado com sucesso! 🎉'
                : 'Ops, algo deu errado'}
            </h3>

            {/* Mensagem da API */}
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.65, fontSize: '0.92rem' }}>
              {feedback.message}
            </p>

            {/* Bloco extra de sucesso — convite ao Discord */}
            {feedback.type === 'success' && (
              <div style={{
                background: 'rgba(88, 101, 242, 0.08)',
                border: '1px solid rgba(88, 101, 242, 0.25)',
                borderRadius: 'var(--r-md)',
                padding: '1rem',
                marginBottom: '1.25rem',
                textAlign: 'left',
              }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                  {feedback.isPending
                    ? '📋 Sua postagem ficará visível após ser revisada por um administrador da comunidade.'
                    : '✅ Sua postagem já está visível no canal de vagas do Discord!'}
                </p>
                <p style={{ fontSize: '0.84rem', color: '#a5b4fc', marginBottom: '0.6rem', fontWeight: 500 }}>
                  Ainda não faz parte da comunidade?
                </p>
                <a
                  id="feedback-discord-invite"
                  href={BRAND.discordInvite}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    padding: '0.65rem 1rem', borderRadius: 'var(--r-md)',
                    background: 'rgba(88, 101, 242, 0.18)', border: '1px solid rgba(88, 101, 242, 0.4)',
                    color: '#7289da', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600,
                    transition: 'background 0.2s, border-color 0.2s, transform 0.15s',
                    width: '100%',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(88,101,242,0.3)'; e.currentTarget.style.borderColor = 'rgba(88,101,242,0.6)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(88,101,242,0.18)'; e.currentTarget.style.borderColor = 'rgba(88,101,242,0.4)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <DiscordIcon />
                  Entrar no grupo do Discord →
                </a>
              </div>
            )}

            {/* Botão principal */}
            <button
              type="button"
              id="feedback-modal-action"
              className="btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
              onClick={() => setFeedback({ type: '', message: '', isPending: false })}
            >
              {feedback.type === 'success' ? 'Publicar outra oportunidade' : '← Fechar e tentar novamente'}
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {activeTab === 'vagas' ? renderVagaStep() : renderFreelaStep()}

        <div className={styles.btnRow}>
          {step > 1 && (
            <button type="button" className="btn-ghost" onClick={() => setStep(1)} style={{ flex: '0 0 auto' }}>
              ← Voltar
            </button>
          )}
          <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
            {loading ? 'Processando...' : step === 2 ? '🚀 Publicar Oportunidade' : 'Próximo →'}
          </button>
        </div>
      </form>
    </>
  );
}
