'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { BRAND } from '../lib/brand';
import DonationModal from './DonationModal';
import ThemeSelector from './ThemeSelector';
import NotificationsMenu from './NotificationsMenu';
import s from './GlobalHeader.module.css';

const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const HeartIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const DiscordIcon = () => (
  <svg width="16" height="16" viewBox="0 0 127.14 96.36" fill="currentColor">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07Z"/>
  </svg>
);

export default function GlobalHeader() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [donationOpen, setDonationOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRoot, setIsRoot] = useState(false);
  const menuRef = useRef(null);

  // Detecta scroll para efeito de blur no header
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fecha menu ao clicar fora
  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  // Fecha menu com Esc
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // Carrega permissões do usuário
  useEffect(() => {
    if (!session?.user?.id) { setIsAdmin(false); setIsRoot(false); return; }
    fetch('/api/admin/me')
      .then(r => r.json())
      .then(d => { setIsAdmin(d.isAdmin || d.isRoot); setIsRoot(d.isRoot); })
      .catch(() => {});
  }, [session?.user?.id]);


  return (
    <>
      <header className={`${s.header} ${scrolled ? s.scrolled : ''}`}>
        <div className={s.inner}>

          {/* Logo */}
          <Link href="/" className={s.logo}>
            <span className={s.logoIcon}>💼</span>
            <span className={s.logoText}>Trampo<span className={s.logoDot}>.</span></span>
          </Link>

          {/* Nav central */}
          <nav className={s.nav} aria-label="Navegação principal">
            <Link href="/" className={s.navLink}>Início</Link>
            <Link href="/mural" className={s.navLink}>Mural Público</Link>
            <Link href="/sobre" className={s.navLink}>Sobre</Link>
            <a
              href={BRAND.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${s.navLink} ${s.downloadBtn}`}
              title="Acessar o repositório no GitHub"
              aria-label="Ver no GitHub"
            >
              <DownloadIcon />
              Ver no GitHub
            </a>
          </nav>

          {/* Actions */}
          <div className={s.actions}>
            {/* Apoiar */}
            <button
              type="button"
              className={s.donateBtn}
              onClick={() => setDonationOpen(true)}
              aria-label="Apoiar o projeto"
            >
              <HeartIcon />
              <span>Apoiar</span>
            </button>

            {/* Login / Avatar */}
            {!session ? (
              <button
                type="button"
                className={s.loginBtn}
                onClick={() => signIn('discord')}
              >
                <DiscordIcon />
                Login
              </button>
            ) : (
              <>
                <NotificationsMenu />
                <div className={s.avatarWrap} ref={menuRef}>
                  <button
                  type="button"
                  className={s.avatarBtn}
                  onClick={() => setMenuOpen(v => !v)}
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                  aria-label="Menu do usuário"
                >
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? 'avatar'}
                      className={s.avatar}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className={s.avatarFallback}>
                      {session.user?.name?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  )}
                  <span className={s.onlineDot} aria-hidden="true" />
                </button>

                {menuOpen && (
                  <div className={s.dropdown} role="menu">
                    <div className={s.dropdownHeader}>
                      <span className={s.dropdownName}>{session.user?.name}</span>
                      <span className={s.dropdownTag}>
                        {isRoot ? '👑 Root Admin' : isAdmin ? '🛡️ Admin' : 'Usuário'}
                      </span>
                    </div>
                    <div className={s.dropdownDivider} />

                    <div style={{ padding: '0.5rem 1rem' }}>
                      <ThemeSelector />
                    </div>
                    
                    <div className={s.dropdownDivider} />

                    {isAdmin && (
                      <>
                        <Link href="/admin" className={s.dropdownItem} role="menuitem" onClick={() => setMenuOpen(false)}>
                          🛡️ Painel Admin
                        </Link>
                        {isRoot && (
                          <>
                            <Link href="/admin/theme-editor" className={s.dropdownItem} role="menuitem" onClick={() => setMenuOpen(false)}>
                              🎨 Editor de Temas
                            </Link>
                            <Link href="/admin/form-config" className={s.dropdownItem} role="menuitem" onClick={() => setMenuOpen(false)}>
                              📋 Config. Formulário
                            </Link>
                          </>
                        )}
                        <div className={s.dropdownDivider} />
                      </>
                    )}

                    <Link href="/publicar" className={s.dropdownItem} role="menuitem" onClick={() => setMenuOpen(false)}>
                      💼 Publicar Oportunidade
                    </Link>

                    <div className={s.dropdownDivider} />

                    <button
                      type="button"
                      className={`${s.dropdownItem} ${s.dropdownSignOut}`}
                      role="menuitem"
                      onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/', redirect: true }); }}
                    >
                      ↩ Sair
                    </button>
                  </div>
                )}
              </div>
            </>
            )}
          </div>
        </div>
      </header>

      {/* Modal de doação */}
      <DonationModal open={donationOpen} onClose={() => setDonationOpen(false)} />
    </>
  );
}
