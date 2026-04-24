'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import s from './theme-editor.module.css';
import { buildThemeCss } from '../../../lib/theme-css';

// ─── Configuração padrão de um tema vazio ────────────────────────────────────
const DEFAULT_CONFIG = {
  vars: {
    '--primary':       '#dc2626',
    '--primary-h':     '#b91c1c',
    '--bg':            '#09090b',
    '--bg-card':       '#121214',
    '--text':          '#f4f4f5',
    '--border-focus':  '#dc2626',
    '--discord':       '#5865f2',
  },
  bgType:      'color',
  bgGifUrl:    '',
  bgBlur:      0,
  showGrid:    true,
  glowOpacity: 1,
  glowColor1:  '#dc2626',
  glowColor2:  '#b91c1c',
  glowPosX1:   '15',
  glowPosY1:   '10',
  glowPosX2:   '85',
  glowPosY2:   '90',
};

// Mapeia --primary para rgba glow automaticamente
function hexToGlowRgba(hex, alpha) {
  // Valida formato — garante que o parse não gere NaN no CSS
  if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return `rgba(220,38,38,${alpha})`; // fallback seguro (vermelho padrão)
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function configToApiPayload(name, config) {
  return {
    name,
    config: {
      vars: config.vars,
      bgType: config.bgType,
      bgGifUrl: config.bgGifUrl || null,
      bgBlur: Number(config.bgBlur),
      showGrid: config.showGrid,
      glowOpacity: Number(config.glowOpacity),
      glowColor1: hexToGlowRgba(config.glowColor1, 0.14),
      glowColor2: hexToGlowRgba(config.glowColor2, 0.10),
      glowPosX1: `${config.glowPosX1}%`,
      glowPosY1: `${config.glowPosY1}%`,
      glowPosX2: `${config.glowPosX2}%`,
      glowPosY2: `${config.glowPosY2}%`,
    },
  };
}

// ─── Hook: aviso de saída sem salvar ─────────────────────────────────────────
function useUnsavedWarning(isDirty) {
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}

// ─── Componentes internos ─────────────────────────────────────────────────────
function Toggle({ label, checked, onChange }) {
  return (
    <div className={s.toggleRow}>
      <span className={s.toggleLabel}>{label}</span>
      <label className={s.toggle}>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className={s.toggleSlider} />
      </label>
    </div>
  );
}

function ColorRow({ label, value, onChange }) {
  return (
    <div className={s.colorRow}>
      <span className={s.colorLabel}>{label}</span>
      <div className={s.colorInputWrap}>
        <input type="color" className={s.colorInput} value={value} onChange={e => onChange(e.target.value)} />
        <span className={s.colorHex}>{value}</span>
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step = 1, unit = '', onChange }) {
  return (
    <div className={s.sliderRow}>
      <span className={s.sliderLabel}>{label}</span>
      <input type="range" className={s.slider} min={min} max={max} step={step}
        value={value} onChange={e => onChange(e.target.value)} />
      <span className={s.sliderValue}>{value}{unit}</span>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ThemeEditorPage() {
  const iframeRef = useRef(null);

  // Dados dos 3 slots carregados do servidor
  const [slots, setSlots] = useState({ 1: null, 2: null, 3: null });
  const [activeSlot, setActiveSlot] = useState(1);
  const [names, setNames] = useState({ 1: 'Tema 1', 2: 'Tema 2', 3: 'Tema 3' });
  const [configs, setConfigs] = useState({ 1: { ...DEFAULT_CONFIG }, 2: { ...DEFAULT_CONFIG }, 3: { ...DEFAULT_CONFIG } });
  const [savedConfigs, setSavedConfigs] = useState({ 1: null, 2: null, 3: null });
  const [defaultSlot, setDefaultSlot] = useState(null);

  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [toast, setToast] = useState(null);
  const [exitModal, setExitModal] = useState(null);
  const [resetModal, setResetModal] = useState(false);

  // ─── Toast ──────────────────────────────────────────────────────
  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const config = configs[activeSlot];
  const name = names[activeSlot];
  const isDirty = JSON.stringify(config) + name !== JSON.stringify(savedConfigs[activeSlot]?.config) + savedConfigs[activeSlot]?.name;

  useUnsavedWarning(isDirty);

  // ─── Carregar temas do servidor ───────────────────────────────────────────
  useEffect(() => {
    fetch('/api/theme')
      .then(r => r.json())
      .then(themes => {
        if (!Array.isArray(themes)) return;
        const newSlots = { 1: null, 2: null, 3: null };
        const newNames = { 1: 'Tema 1', 2: 'Tema 2', 3: 'Tema 3' };
        const newConfigs = { ...configs };
        const newSaved = { 1: null, 2: null, 3: null };

        themes.forEach(t => {
          const slot = t.slot;
          newSlots[slot] = t;
          newNames[slot] = t.name;
          const c = t.config || {};
          const loadedConfig = {
            vars: { ...DEFAULT_CONFIG.vars, ...(c.vars || {}) },
            bgType: c.bgType || 'color',
            bgGifUrl: c.bgGifUrl || '',
            bgBlur: c.bgBlur ?? 0,
            showGrid: c.showGrid !== false,
            glowOpacity: c.glowOpacity ?? 1,
            glowColor1: '#dc2626',
            glowColor2: '#b91c1c',
            glowPosX1: String(parseInt(c.glowPosX1 || '15')),
            glowPosY1: String(parseInt(c.glowPosY1 || '10')),
            glowPosX2: String(parseInt(c.glowPosX2 || '85')),
            glowPosY2: String(parseInt(c.glowPosY2 || '90')),
          };
          newConfigs[slot] = loadedConfig;
          newSaved[slot] = { name: t.name, config: loadedConfig };
          if (t.isDefault) setDefaultSlot(slot);
        });

        setSlots(newSlots);
        setNames(newNames);
        setConfigs(newConfigs);
        setSavedConfigs(newSaved);
      })
      .catch(() => {});
  }, []);

  // ─── Enviar preview para iframe via postMessage ───────────────────────────
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const payload = configToApiPayload(name, config);
    const css = buildThemeCss({ config: payload.config });

    const send = () => {
      iframe.contentWindow?.postMessage({ type: 'PREVIEW_THEME', css }, window.location.origin);
    };

    if (iframe.contentDocument?.readyState === 'complete') {
      send();
    } else {
      iframe.onload = send;
    }
  }, [config, name]);

  // ─── Funções de edição ────────────────────────────────────────────────────
  const setVar = useCallback((key, val) => {
    setConfigs(prev => ({
      ...prev,
      [activeSlot]: { ...prev[activeSlot], vars: { ...prev[activeSlot].vars, [key]: val } },
    }));
  }, [activeSlot]);

  const setField = useCallback((key, val) => {
    setConfigs(prev => ({
      ...prev,
      [activeSlot]: { ...prev[activeSlot], [key]: val },
    }));
  }, [activeSlot]);

  // ─── Salvar tema ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = configToApiPayload(name, config);
      const res = await fetch(`/api/theme/${activeSlot}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar.');

      setSavedConfigs(prev => ({ ...prev, [activeSlot]: { name, config } }));
      setSlots(prev => ({ ...prev, [activeSlot]: data }));
      showToast('✅ Tema salvo com sucesso!', 'success');
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Definir como padrão ──────────────────────────────────────────────────
  const handleActivate = async () => {
    if (!slots[activeSlot]) {
      showToast('Salve o tema antes de defini-lo como padrão.', 'error');
      return;
    }
    setActivating(true);
    try {
      const res = await fetch(`/api/theme/${activeSlot}/activate`, { method: 'PUT' });
      if (!res.ok) throw new Error('Erro ao ativar tema.');
      setDefaultSlot(activeSlot);
      showToast('🎨 Tema definido como padrão do site!', 'success');
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setActivating(false);
    }
  };

  // ─── Descartar mudanças (volta ao último save) ──────────────────────────
  const handleDiscard = () => {
    const saved = savedConfigs[activeSlot];
    if (saved) {
      setConfigs(prev => ({ ...prev, [activeSlot]: saved.config }));
      setNames(prev => ({ ...prev, [activeSlot]: saved.name }));
    } else {
      setConfigs(prev => ({ ...prev, [activeSlot]: { ...DEFAULT_CONFIG } }));
      setNames(prev => ({ ...prev, [activeSlot]: `Tema ${activeSlot}` }));
    }
  };

  // ─── Restaurar visual padrão de fábrica ──────────────────────────────────
  const handleResetToDefault = () => {
    setConfigs(prev => ({ ...prev, [activeSlot]: { ...DEFAULT_CONFIG, vars: { ...DEFAULT_CONFIG.vars } } }));
    setNames(prev => ({ ...prev, [activeSlot]: `Tema ${activeSlot}` }));
    setResetModal(false);
    showToast('♻️ Visual original restaurado. Salve para aplicar.', 'success');
  };

  // ─── Troca de slot com aviso ──────────────────────────────────────────────
  const switchSlot = (slot) => {
    if (isDirty) {
      setExitModal({ action: () => { setActiveSlot(slot); setExitModal(null); } });
    } else {
      setActiveSlot(slot);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={s.page}>
      {/* Botão voltar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          href="/admin"
          className={s.backLink}
          onClick={e => {
            if (isDirty) {
              e.preventDefault();
              setExitModal({ action: () => { window.location.href = '/admin'; } });
            }
          }}
        >
          ← Voltar ao Painel Admin
        </Link>
      </div>

      <div className={s.header}>
        <div>
          <h1 className={s.title}>🎨 Editor de <span>Temas</span></h1>
          <p className={s.subtitle}>Personalize as cores, fundo e efeitos do site. Visualize em tempo real antes de publicar.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isDirty && <span className={s.dirtyBadge}>⚠ Mudanças não salvas</span>}
        </div>
      </div>


      <div className={s.layout}>
        {/* ── Painel de Controles ──────────────────────────────────── */}
        <div className={s.controls}>
          {/* Tabs de slot */}
          <div className={s.slotTabs}>
            {[1, 2, 3].map(slot => (
              <button key={slot} className={`${s.slotTab} ${activeSlot === slot ? s.active : ''}`}
                onClick={() => switchSlot(slot)}>
                Slot {slot}
                <span className={s.slotTabName}>{names[slot]}</span>
                {defaultSlot === slot && <span className={s.defaultBadge}>Padrão</span>}
              </button>
            ))}
          </div>

          <div className={s.controlsBody}>
            {/* Nome do tema */}
            <div className={s.section}>
              <div className={s.sectionTitle}>Identificação</div>
              <div className={s.field}>
                <label className={s.fieldLabel}>Nome do Tema</label>
                <input className={s.fieldInput} maxLength={50} value={name}
                  onChange={e => setNames(prev => ({ ...prev, [activeSlot]: e.target.value }))}
                  placeholder="Ex: Modo Escuro, Clube Gaming..." />
              </div>
            </div>

            {/* Background */}
            <div className={s.section}>
              <div className={s.sectionTitle}>Fundo do Site</div>
              <div className={s.bgRadio}>
                {['color', 'gif'].map(type => (
                  <button key={type} className={`${s.bgRadioBtn} ${config.bgType === type ? s.active : ''}`}
                    onClick={() => setField('bgType', type)}>
                    {type === 'color' ? '🎨 Cor Sólida' : '🖼️ GIF / Imagem'}
                  </button>
                ))}
              </div>

              {config.bgType === 'color' && (
                <ColorRow label="Cor de Fundo" value={config.vars['--bg']}
                  onChange={v => setVar('--bg', v)} />
              )}

              {config.bgType === 'gif' && (
                <>
                  <div className={s.field}>
                    <label className={s.fieldLabel}>URL do GIF / Imagem (https://)</label>
                    <input className={s.fieldInput} type="url" value={config.bgGifUrl}
                      onChange={e => setField('bgGifUrl', e.target.value)}
                      placeholder="https://i.giphy.com/seu-gif.gif" />
                  </div>
                  <SliderRow label="Blur do fundo" value={config.bgBlur} min={0} max={20} unit="px"
                    onChange={v => setField('bgBlur', v)} />
                </>
              )}
            </div>

            {/* Cores principais */}
            <div className={s.section}>
              <div className={s.sectionTitle}>Paleta de Cores</div>
              <ColorRow label="🔴 Cor Principal (botões)"    value={config.vars['--primary']}      onChange={v => { setVar('--primary', v); setVar('--primary-h', v); }} />
              <ColorRow label="🃏 Fundo dos Cards"           value={config.vars['--bg-card']}      onChange={v => setVar('--bg-card', v)} />
              <ColorRow label="📝 Cor do Texto"              value={config.vars['--text']}         onChange={v => setVar('--text', v)} />
              <ColorRow label="✨ Borda de Foco / Destaque"  value={config.vars['--border-focus']} onChange={v => setVar('--border-focus', v)} />
              <ColorRow label="💬 Cor do Discord (botão)"    value={config.vars['--discord']}      onChange={v => setVar('--discord', v)} />
            </div>

            {/* Efeitos visuais */}
            <div className={s.section}>
              <div className={s.sectionTitle}>Efeitos Visuais</div>
              <Toggle label="Linhas de grade no fundo" checked={config.showGrid}
                onChange={v => setField('showGrid', v)} />
            </div>

            {/* Gradiente */}
            <div className={s.section}>
              <div className={s.sectionTitle}>Gradiente Radial</div>
              <SliderRow label="Opacidade geral" value={config.glowOpacity} min={0} max={1} step={0.05}
                onChange={v => setField('glowOpacity', v)} />

              <div style={{ fontSize: '0.72rem', color: '#52525b', marginTop: '0.25rem' }}>Glow 1</div>
              <ColorRow label="Cor" value={config.glowColor1} onChange={v => setField('glowColor1', v)} />
              <SliderRow label="Posição X" value={config.glowPosX1} min={0} max={100} unit="%"
                onChange={v => setField('glowPosX1', v)} />
              <SliderRow label="Posição Y" value={config.glowPosY1} min={0} max={100} unit="%"
                onChange={v => setField('glowPosY1', v)} />

              <div style={{ fontSize: '0.72rem', color: '#52525b', marginTop: '0.25rem' }}>Glow 2</div>
              <ColorRow label="Cor" value={config.glowColor2} onChange={v => setField('glowColor2', v)} />
              <SliderRow label="Posição X" value={config.glowPosX2} min={0} max={100} unit="%"
                onChange={v => setField('glowPosX2', v)} />
              <SliderRow label="Posição Y" value={config.glowPosY2} min={0} max={100} unit="%"
                onChange={v => setField('glowPosY2', v)} />
            </div>
          </div>

          {/* Botões de ação */}
          <div className={s.actions}>
            <button className={s.btnSave} onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : `💾 Salvar Tema ${activeSlot}`}
            </button>
            <button className={s.btnActivate} onClick={handleActivate} disabled={activating || defaultSlot === activeSlot}>
              {defaultSlot === activeSlot ? '✅ Já é o tema padrão' : '🌐 Definir como Padrão do Site'}
            </button>
            <button className={s.btnDiscard} onClick={handleDiscard}>
              Descartar alterações
            </button>
            <button className={s.btnReset} onClick={() => setResetModal(true)}
              title="Restaura o visual original vermelho/preto como ponto de partida (não salva automaticamente)">
              ♻️ Restaurar Original
            </button>
          </div>
        </div>

        {/* ── Preview iframe ───────────────────────────────────────── */}
        <div className={s.preview}>
          <div className={s.previewHeader}>
            <div className={s.previewTitle}>
              <span className={s.previewDot} /> Preview em tempo real
            </div>
            <span style={{ fontSize: '0.72rem', color: '#3f3f46' }}>Somente você está vendo isso</span>
          </div>
          <iframe
            ref={iframeRef}
            src="/"
            className={s.previewIframe}
            title="Preview do tema"
          />
        </div>
      </div>

      {/* ── Modal: mudanças não salvas ───────────────────────────── */}
      {exitModal && (
        <div className={s.modalOverlay} onClick={() => setExitModal(null)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <div className={s.modalIcon}>⚠️</div>
            <h3 className={s.modalTitle}>Mudanças não salvas</h3>
            <p className={s.modalDesc}>
              Você tem alterações pendentes no Tema {activeSlot}. Se sair agora, as mudanças serão perdidas.
            </p>
            <div className={s.modalBtns}>
              <button className={s.modalBtnCancel} onClick={() => setExitModal(null)}>
                Continuar editando
              </button>
              <button className={s.modalBtnConfirm} onClick={exitModal.action}>
                Descartar e sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: restaurar padrão de fábrica ────────────────────── */}
      {resetModal && (
        <div className={s.modalOverlay} onClick={() => setResetModal(false)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <div className={s.modalIcon}>♻️</div>
            <h3 className={s.modalTitle}>Restaurar visual original?</h3>
            <p className={s.modalDesc}>
              Isso vai carregar o tema vermelho/preto padrão de fábrica no Slot {activeSlot}.
              <br /><br />
              <strong style={{ color: '#fafafa' }}>Nada é salvo automaticamente</strong> — você vai visualizar o original no preview e pode salvar quando quiser (ou descartar para voltar ao que estava).
            </p>
            <div className={s.modalBtns}>
              <button className={s.modalBtnCancel} onClick={() => setResetModal(false)}>
                Cancelar
              </button>
              <button className={s.modalBtnConfirm} onClick={handleResetToDefault}>
                ♻️ Restaurar Original
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ────────────────────────────────────────────────── */}
      {toast && (
        <div className={`${s.toast} ${s[toast.type]}`}>{toast.msg}</div>
      )}
    </div>
  );
}
