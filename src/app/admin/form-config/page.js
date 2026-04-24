'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import s from './form-config.module.css';

const CATEGORIES = [
  {
    key:   'job_levels',
    icon:  '📊',
    label: 'Níveis de Experiência',
    desc:  'Os níveis que aparecem na hora de publicar uma vaga. Ex: Estágio, Júnior, Pleno...',
    hint:  'Dica: coloque os níveis do mais iniciante ao mais experiente.',
  },
  {
    key:   'job_regimes',
    icon:  '📋',
    label: 'Tipos de Contratação',
    desc:  'As modalidades de contratação disponíveis no formulário. Ex: CLT, PJ, Freelancer...',
    hint:  'Dica: coloque as modalidades mais comuns no seu nicho.',
  },
  {
    key:   'edu_institutions',
    icon:  '🎓',
    label: 'Universidades e Instituições',
    desc:  'Lista de faculdades e cursos que aparecem no cadastro de freelancers.',
    hint:  'Dica: você pode adicionar cursos online, bootcamps e plataformas também.',
  },
  {
    key:   'edu_courses',
    icon:  '📚',
    label: 'Cursos e Formações',
    desc:  'Os cursos que o freelancer pode selecionar no perfil dele.',
    hint:  'Dica: adapte para o nicho do seu servidor (design, marketing, direito, etc.).',
  },
  {
    key:   'edu_levels',
    icon:  '🏆',
    label: 'Nível de Formação',
    desc:  'O grau de escolaridade/formação do freelancer.',
    hint:  'Dica: inclua bootcamps e cursos livres se for relevante para sua comunidade.',
  },
];

export default function FormConfigPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [resetting, setResetting] = useState({});
  const [inputs, setInputs] = useState({});
  const [drafts, setDrafts] = useState({});
  const [toast, setToast] = useState(null);
  const [resetModal, setResetModal] = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetch('/api/admin/form-config')
      .then(r => {
        if (!r.ok) throw new Error('Erro ao carregar configurações.');
        return r.json();
      })
      .then(d => {
        setData(d);
        const initial = {};
        for (const cat of CATEGORIES) initial[cat.key] = [...(d[cat.key]?.options ?? [])];
        setDrafts(initial);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const addTag = (key) => {
    const val = (inputs[key] ?? '').trim();
    if (!val || val.length > 100) return;
    if (drafts[key]?.includes(val)) {
      showToast('Essa opção já existe.', 'error');
      return;
    }
    setDrafts(prev => ({ ...prev, [key]: [...(prev[key] ?? []), val] }));
    setInputs(prev => ({ ...prev, [key]: '' }));
  };

  const removeTag = (key, idx) => {
    setDrafts(prev => {
      const next = [...prev[key]];
      next.splice(idx, 1);
      return { ...prev, [key]: next };
    });
  };

  const handleSave = async (key) => {
    if (!drafts[key]?.length) {
      showToast('Adicione pelo menos 1 opção antes de salvar.', 'error');
      return;
    }
    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch('/api/admin/form-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, options: drafts[key] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(prev => ({ ...prev, [key]: { ...prev[key], options: json.saved, isCustom: true } }));
      showToast('✅ Opções salvas com sucesso!');
    } catch (err) {
      showToast(err.message || 'Erro ao salvar.', 'error');
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const confirmReset = async (key) => {
    setResetting(prev => ({ ...prev, [key]: true }));
    setResetModal(null);
    try {
      const res = await fetch('/api/admin/form-config', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) throw new Error('Erro ao restaurar padrão.');
      // Recarrega dados
      const fresh = await fetch('/api/admin/form-config').then(r => r.json());
      setData(fresh);
      setDrafts(prev => ({ ...prev, [key]: [...(fresh[key]?.options ?? [])] }));
      showToast('♻️ Padrão restaurado com sucesso!');
    } catch (err) {
      showToast(err.message || 'Erro ao restaurar.', 'error');
    } finally {
      setResetting(prev => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.loadingWrap}>
          <div className={s.spinner} />
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={s.page}>
        <div className={s.loadingWrap}>
          <p style={{ color: '#f87171' }}>⚠️ Falha ao carregar configurações. Recarregue a página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div style={{ marginBottom: '1.25rem' }}>
        <Link href="/admin" className={s.backLink}>← Voltar ao Painel Admin</Link>
      </div>

      <div className={s.header}>
        <div>
          <h1 className={s.title}>📋 Configuração do <span>Formulário</span></h1>
          <p className={s.subtitle}>
            Personalize as opções que aparecem para quem publica vagas e freelas.
            Adapte para o nicho do seu servidor — design, marketing, direito, qualquer área.
          </p>
        </div>
      </div>

      <div className={s.grid}>
        {CATEGORIES.map(cat => {
          const meta     = data?.[cat.key];
          const options  = drafts[cat.key] ?? [];
          const isCustom = meta?.isCustom;
          const isSaving = saving[cat.key];
          const isReset  = resetting[cat.key];

          return (
            <div key={cat.key} className={s.card}>
              <div className={s.cardHeader}>
                <div className={s.cardTitleRow}>
                  <span className={s.cardIcon}>{cat.icon}</span>
                  <div>
                    <h2 className={s.cardTitle}>{cat.label}</h2>
                    <p className={s.cardDesc}>{cat.desc}</p>
                  </div>
                </div>
                {isCustom && (
                  <span className={s.customBadge}>✏️ Customizado</span>
                )}
              </div>

              {/* Tags */}
              <div className={s.tagList}>
                {options.map((opt, idx) => (
                  <span key={idx} className={s.tag}>
                    {opt}
                    <button
                      className={s.tagRemove}
                      onClick={() => removeTag(cat.key, idx)}
                      title="Remover esta opção"
                    >×</button>
                  </span>
                ))}
                {options.length === 0 && (
                  <span className={s.emptyTags}>Nenhuma opção ainda. Adicione abaixo.</span>
                )}
              </div>

              {/* Input para adicionar */}
              <div className={s.addRow}>
                <input
                  className={s.addInput}
                  value={inputs[cat.key] ?? ''}
                  onChange={e => setInputs(prev => ({ ...prev, [cat.key]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(cat.key); } }}
                  placeholder="Digite e pressione Enter para adicionar..."
                  maxLength={100}
                />
                <button className={s.addBtn} onClick={() => addTag(cat.key)}>+</button>
              </div>
              <p className={s.hint}>{cat.hint}</p>

              {/* Ações */}
              <div className={s.cardActions}>
                <button
                  className={s.btnSave}
                  onClick={() => handleSave(cat.key)}
                  disabled={isSaving || isReset}
                >
                  {isSaving ? 'Salvando...' : '💾 Salvar'}
                </button>
                {isCustom && (
                  <button
                    className={s.btnReset}
                    onClick={() => setResetModal(cat.key)}
                    disabled={isSaving || isReset}
                  >
                    {isReset ? 'Restaurando...' : '♻️ Voltar ao padrão'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de confirmação de reset */}
      {resetModal && (() => {
        const cat = CATEGORIES.find(c => c.key === resetModal);
        return (
          <div className={s.modalOverlay} onClick={() => setResetModal(null)}>
            <div className={s.modal} onClick={e => e.stopPropagation()}>
              <div className={s.modalIcon}>♻️</div>
              <h3 className={s.modalTitle}>Restaurar padrão?</h3>
              <p className={s.modalDesc}>
                As opções de <strong style={{ color: '#fafafa' }}>{cat?.label}</strong> voltarão
                para a lista original de TI. Suas customizações serão apagadas.
              </p>
              <div className={s.modalBtns}>
                <button className={s.modalBtnCancel} onClick={() => setResetModal(null)}>
                  Cancelar
                </button>
                <button className={s.modalBtnConfirm} onClick={() => confirmReset(resetModal)}>
                  ♻️ Restaurar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast */}
      {toast && (
        <div className={`${s.toast} ${s[toast.type]}`}>{toast.msg}</div>
      )}
    </div>
  );
}
