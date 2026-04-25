"use client";

import { useState, useEffect, useRef } from 'react';
import s from './NotificationsMenu.module.css';

// Ícone do Sino
const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

function formatTime(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState(null); // Modal details
  const ref = useRef(null);

  const fetchNotifs = async () => {
    try {
      const res = await fetch(`/api/notifications?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setNotifs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
    // Atualiza a cada 1 minuto
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClearAll = async () => {
    try {
      // Remove da UI imediatamente (mantém apenas as de sistema, ex: contagem do admin)
      setNotifs(notifs.filter(n => n.isSystem));
      
      // Envia req pro banco
      await fetch('/api/notifications', { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={s.wrapper} ref={ref}>
      <button 
        className={s.bellBtn} 
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifs(); // recarrega ao abrir
        }}
        aria-label="Notificações"
      >
        <BellIcon />
        {notifs.length > 0 && (
          <span className={s.badge}>
            {notifs.length > 9 ? '9+' : notifs.length}
          </span>
        )}
      </button>

      {open && (
        <div className={s.dropdown}>
          <div className={s.header}>
            <h3 className={s.title}>Notificações</h3>
            {notifs.length > 0 && !notifs.every(n => n.isSystem) && (
              <button className={s.clearBtn} onClick={handleClearAll}>
                Limpar todas
              </button>
            )}
          </div>

          {loading && notifs.length === 0 ? (
            <div className={s.empty}>Carregando...</div>
          ) : notifs.length === 0 ? (
            <div className={s.empty}>
              <div className={s.emptyIcon}>📭</div>
              Sua caixa de entrada está limpa.
            </div>
          ) : (
            <ul className={s.list}>
              {notifs.map(n => {
                // Determina o ícone pelo título
                let icon = '🔔';
                if (n.title.includes('✅')) icon = '✅';
                if (n.title.includes('❌')) icon = '❌';
                if (n.title.includes('🛡️')) icon = '🛡️';
                if (n.title.includes('🔻')) icon = '🔻';

                let isSystemAdmin = n.isSystem && n.title.includes('Moderação');

                return (
                  <li 
                    key={n.id} 
                    className={`${s.item} ${s.itemClickable}`}
                    onClick={() => {
                      if (isSystemAdmin) {
                        window.location.href = '/admin';
                      } else {
                        setSelectedNotif(n);
                      }
                    }}
                  >
                    <div className={s.itemIcon}>{icon}</div>
                    <div className={s.itemContent}>
                      <h4 className={s.itemTitle}>{n.title.replace(/[✅❌🛡️🔻]\s*/, '')}</h4>
                      <p className={s.itemMessageLineClamp}>{n.message}</p>
                      <span className={s.itemTime}>{formatTime(n.createdAt)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
      {selectedNotif && (
        <div className={s.modalOverlay} onClick={() => setSelectedNotif(null)}>
          <div className={s.modalContent} onClick={e => e.stopPropagation()}>
            <h3 className={s.modalTitle}>{selectedNotif.title}</h3>
            <p className={s.modalMessage}>{selectedNotif.message}</p>
            <span className={s.modalTime}>{formatTime(selectedNotif.createdAt)}</span>
            <button className={s.btnOk} onClick={() => setSelectedNotif(null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
