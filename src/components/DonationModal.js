'use client';

import { useEffect, useRef } from 'react';
import { BRAND } from '../lib/brand';
import s from './DonationModal.module.css';

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

export default function DonationModal({ open, onClose }) {
  const overlayRef = useRef(null);
  const firstBtnRef = useRef(null);

  // Fechar com Esc + armadilha de foco
  useEffect(() => {
    if (!open) return;
    firstBtnRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={s.overlay}
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="donation-title"
    >
      <div className={s.modal}>
        {/* Header */}
        <div className={s.modalHeader}>
          <div className={s.heartWrap} aria-hidden="true">
            <HeartIcon />
          </div>
          <div>
            <h2 id="donation-title" className={s.title}>Apoiar o Trampo</h2>
            <p className={s.subtitle}>
              Seu apoio mantém o projeto gratuito e open source para sempre. ❤️
            </p>
          </div>
          <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Fechar modal">
            ✕
          </button>
        </div>

        {/* Cards de valor */}
        <div className={s.cards}>
          {BRAND.donationLinks.map((plan, i) => (
            <a
              key={plan.url}
              href={plan.url}
              target="_blank"
              rel="noopener noreferrer"
              className={s.card}
              ref={i === 0 ? firstBtnRef : undefined}
            >
              <span className={s.cardLabel}>{plan.label}</span>
              <span className={s.cardAmount}>{plan.amount}</span>
              <span className={s.cardCta}>Apoiar →</span>
            </a>
          ))}
        </div>

        {/* Rodapé */}
        <p className={s.footer}>
          🔒 Checkout oficial do Mercado Pago. Pagamento 100% seguro.
        </p>
        <p className={s.founderNote}>
          Criado por{' '}
          <a href={BRAND.founderLinkedin} target="_blank" rel="noopener noreferrer" className={s.founderLink}>
            {BRAND.founderName}
          </a>
        </p>
      </div>
    </div>
  );
}
