'use client';

import { useState, useEffect } from 'react';
import s from './AdBanner.module.css';

/**
 * AdBanner — busca anúncio da API própria (/api/ads).
 * Anti-adblock: usa fetch na própria rota, não rede externa.
 * Aparece em duas posições: horizontal (topo de conteúdo) e floating (canto inferior direito).
 */
export default function AdBanner({ variant = 'float' }) {
  const [ad, setAd] = useState(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    fetch('/api/ads')
      .then(r => r.json())
      .then(data => { if (data?.targetUrl) setAd(data); })
      .catch(() => {}); // silencioso — nunca quebrar a UI
  }, []);

  const handleClick = () => {
    if (!ad?.id) return;
    // Registra clique sem bloquear a navegação
    navigator.sendBeacon?.('/api/ads/click', JSON.stringify({ adId: ad.id }))
      ?? fetch('/api/ads/click', { method: 'POST', body: JSON.stringify({ adId: ad.id }), headers: { 'Content-Type': 'application/json' } }).catch(() => {});
  };

  if (!ad || !visible) return null;

  if (variant === 'float') {
    return (
      <div className={s.float}>
        <div className={s.floatHeader}>
          <span className={s.adLabel}>anúncio</span>
          <button
            type="button"
            className={s.closeBtn}
            onClick={() => setVisible(false)}
            aria-label="Fechar anúncio"
          >×</button>
        </div>
        {ad.isFallback ? (
          <a
            href={ad.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={s.floatFallback}
            onClick={handleClick}
          >
            <span className={s.star}>⭐</span>
            <span>{ad.altText}</span>
          </a>
        ) : (
          <a
            href={ad.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={s.floatImg}
            onClick={handleClick}
          >
            <img src={ad.imageUrl} alt={ad.altText} loading="lazy" />
          </a>
        )}
      </div>
    );
  }

  // variant = 'horizontal'
  return (
    <div className={s.horizontal}>
      <span className={s.adLabel}>anúncio</span>
      {ad.isFallback ? (
        <a
          href={ad.targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={s.hFallback}
          onClick={handleClick}
        >
          ⭐ {ad.altText}
        </a>
      ) : (
        <a
          href={ad.targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={s.hLink}
          onClick={handleClick}
        >
          <img src={ad.imageUrl} alt={ad.altText} loading="lazy" className={s.hImg} />
        </a>
      )}
      <button
        type="button"
        className={s.hClose}
        onClick={() => setVisible(false)}
        aria-label="Fechar anúncio"
      >×</button>
    </div>
  );
}
