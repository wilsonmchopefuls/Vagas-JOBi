'use client';

import { useState, useEffect } from 'react';
import s from './sobre.module.css';

/**
 * GifPortrait — exibe o gif em escala de cinza por padrão.
 * Ao hover (ou toque em mobile), revela a versão colorida com transição suave.
 * Quando houver um segundo gif, basta passar `hoverSrc`.
 */
export default function GifPortrait({
  src = '/assets/gif2.gif',
  hoverSrc = null, // quando disponível, coloca o segundo gif aqui
  alt = 'Wilson Teofilo',
}) {
  const [hovered, setHovered] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)');
    setIsTouch(mq.matches);
    const handler = () => setIsTouch(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggle = () => { if (isTouch) setHovered(v => !v); };

  return (
    <div
      className={`${s.gifWrap} ${hovered ? s.gifHovered : ''}`}
      onMouseEnter={() => { if (!isTouch) setHovered(true); }}
      onMouseLeave={() => { if (!isTouch) setHovered(false); }}
      onClick={toggle}
      role={isTouch ? 'button' : undefined}
      tabIndex={isTouch ? 0 : undefined}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}
      aria-label={isTouch ? (hovered ? 'Toque para voltar ao padrão' : 'Toque para colorir') : undefined}
    >
      {/* Camada base: sempre o gif original */}
      <img
        src={src}
        alt={alt}
        className={`${s.gifBase} ${hovered && hoverSrc ? s.gifBaseHidden : ''}`}
        draggable={false}
      />

      {/* Camada hover: segundo gif (ou ausente → apenas o filtro muda) */}
      {hoverSrc && (
        <img
          src={hoverSrc}
          alt={`${alt} — versão alternativa`}
          className={`${s.gifHover} ${hovered ? s.gifHoverVisible : ''}`}
          draggable={false}
        />
      )}

      {/* Hint de toque em mobile */}
      {isTouch && (
        <div className={s.touchHint} aria-live="polite">
          {hovered ? 'Toque para voltar' : 'Toque para revelar'}
        </div>
      )}
    </div>
  );
}
