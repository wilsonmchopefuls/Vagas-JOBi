'use client';

import { useState, useMemo } from 'react';
import s from './mural.module.css';

const DiscordIcon = () => (
  <svg width="16" height="16" viewBox="0 0 127.14 96.36" fill="currentColor">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07Z"/>
  </svg>
);

export default function MuralClient({ initialJobs, config }) {
  const [activeTab, setActiveTab] = useState('vagas'); // 'vagas' ou 'freelancers'
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterRegime, setFilterRegime] = useState('');
  const [filterCourse, setFilterCourse] = useState('');

  // Filtra as vagas baseado nos estados
  const filteredJobs = useMemo(() => {
    return initialJobs.filter(job => {
      // Filtrar por aba
      if (job.type !== activeTab) return false;

      const p = job.payload || {};

      // Filtro de busca livre (título, descrição, empresa, nome)
      if (search) {
        const term = search.toLowerCase();
        const text = Object.values(p).join(' ').toLowerCase();
        if (!text.includes(term)) return false;
      }

      // Filtros específicos para Vagas
      if (activeTab === 'vagas') {
        if (filterLevel && p.level !== filterLevel) return false;
        if (filterRegime && p.regime !== filterRegime) return false;
      }

      // Filtros específicos para Freelas
      if (activeTab === 'freelancers') {
        const firstEdu = p.educations?.[0] || {};
        if (filterLevel && firstEdu.level !== filterLevel) return false;
        if (filterCourse && firstEdu.course !== filterCourse) return false;
      }

      return true;
    });
  }, [initialJobs, activeTab, search, filterLevel, filterRegime, filterCourse]);

  // Função para abrir o Discord
  const openDiscord = (discordId) => {
    // Tenta abrir o deep link do Discord. Se o navegador bloquear ou não tiver, cai no link web.
    window.open(`discord://-/users/${discordId}`, '_blank');
    // Fallback pra web:
    // setTimeout(() => window.open(`https://discord.com/users/${discordId}`, '_blank'), 500);
  };

  const formatData = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    const now = new Date();
    const expires = new Date(expiresAt);
    return now > expires;
  };

  return (
    <>
      <div className={s.header}>
        <h1 className={s.title}>Mural <span>Público</span></h1>
        <p className={s.subtitle}>
          Encontre as melhores oportunidades ou os talentos certos. Filtre, pesquise e conecte-se diretamente pelo Discord.
        </p>
      </div>

      <div className={s.tabs}>
        <button 
          className={`${s.tab} ${activeTab === 'vagas' ? s.active : ''}`}
          onClick={() => { setActiveTab('vagas'); setFilterLevel(''); setFilterRegime(''); }}
        >
          💼 Vagas de Emprego
        </button>
        <button 
          className={`${s.tab} ${activeTab === 'freelancers' ? s.active : ''}`}
          onClick={() => { setActiveTab('freelancers'); setFilterLevel(''); setFilterCourse(''); }}
        >
          👨‍💻 Freelancers
        </button>
      </div>

      <div className={s.layout}>
        {/* Sidebar de Filtros */}
        <aside className={s.sidebar}>
          <div className={s.filterGroup}>
            <label className={s.filterTitle}>Pesquisar</label>
            <input 
              type="text" 
              className={s.searchBox} 
              placeholder="Ex: React, Design..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {activeTab === 'vagas' && (
            <>
              <div className={s.filterGroup}>
                <label className={s.filterTitle}>Nível</label>
                <select className={s.select} value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
                  <option value="">Todos</option>
                  {config.job_levels?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className={s.filterGroup}>
                <label className={s.filterTitle}>Regime</label>
                <select className={s.select} value={filterRegime} onChange={e => setFilterRegime(e.target.value)}>
                  <option value="">Todos</option>
                  {config.job_regimes?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </>
          )}

          {activeTab === 'freelancers' && (
            <>
              <div className={s.filterGroup}>
                <label className={s.filterTitle}>Nível de Formação</label>
                <select className={s.select} value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
                  <option value="">Todos</option>
                  {config.edu_levels?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className={s.filterGroup}>
                <label className={s.filterTitle}>Área/Curso</label>
                <select className={s.select} value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
                  <option value="">Todos</option>
                  {config.edu_courses?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </>
          )}
        </aside>

        {/* Grid de Cards */}
        <div className={s.grid}>
          {filteredJobs.length === 0 && (
            <div className={s.emptyState}>
              <div className={s.emptyIcon}>👻</div>
              <h3>Nenhum resultado encontrado</h3>
              <p>Tente mudar os filtros ou o termo da pesquisa.</p>
            </div>
          )}

          {filteredJobs.map(job => {
            const p = job.payload;
            
            if (job.type === 'vagas') {
              return (
                <div key={job.id} className={s.card}>
                  <div className={s.cardHeader}>
                    <div>
                      <h3 className={s.cardTitle}>{p.title}</h3>
                      <span className={s.cardSubtitle}>🏢 {p.company}</span>
                    </div>
                  </div>
                  <div className={s.cardBadges}>
                    {isExpired(job.expiresAt) && <span className={s.badge} style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.1)' }}>⏳ Expirada</span>}
                    <span className={`${s.badge} ${s.badgePrimary}`}>{p.level}</span>
                    <span className={s.badge}>{p.regime}</span>
                  </div>
                  <p className={s.cardDesc}>{p.description}</p>
                  
                  <div className={s.cardFooter}>
                    <span className={s.cardDate}>{formatData(job.createdAt)}</span>
                    <button className={s.cardCta} onClick={() => openDiscord(job.discordId)}>
                      <DiscordIcon /> Contatar
                    </button>
                  </div>
                </div>
              );
            }

            // Card Freela
            return (
              <div key={job.id} className={s.card}>
                <div className={s.cardHeader}>
                  <div>
                    <h3 className={s.cardTitle}>{p.company}</h3>
                    <span className={s.cardSubtitle}>✨ {p.title}</span>
                  </div>
                </div>
                <div className={s.cardBadges}>
                  {isExpired(job.expiresAt) && <span className={s.badge} style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.1)' }}>⏳ Expirada</span>}
                  <span className={`${s.badge} ${s.badgePrimary}`}>{p.availability}</span>
                  {p.educations?.[0]?.course && <span className={s.badge}>{p.educations[0].course}</span>}
                  {p.educations?.[0]?.level && <span className={s.badge}>{p.educations[0].level}</span>}
                </div>
                <p className={s.cardDesc}>{p.skills}</p>
                
                <div className={s.cardFooter}>
                  <span className={s.cardDate}>{formatData(job.createdAt)}</span>
                  <button className={s.cardCta} onClick={() => openDiscord(job.discordId)}>
                    <DiscordIcon /> Falar com Dev
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
