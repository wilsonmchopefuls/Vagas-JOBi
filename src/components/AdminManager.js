"use client";

import { useState, useRef } from "react";
import styles from "../app/admin/admin.module.css";

export default function AdminManager({ allAdmins, isRoot }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);

  const searchUsers = async (q) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedUser(null);
    setOpen(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      searchUsers(val);
    }, 300);
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setQuery(user.name);
    setOpen(false);
  };

  if (!isRoot) {
    return null; // Apenas Root vê o painel de gerenciamento de equipe
  }

  return (
    <div className={styles.section}>
      <p className={styles.sectionTitle}>🛡️ Equipe de RH / Admins (Root Apenas)</p>
      
      <form action="/api/admin/promote" method="POST" style={{ marginBottom: '1rem' }}>
        <div className={styles.adminRow} style={{ position: 'relative' }}>
          {/* Autocomplete Input */}
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="Pesquisar usuário pelo nome (Discord)..."
              className="input-field"
              value={query}
              onChange={handleInputChange}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 200)}
              style={{ width: '100%', paddingLeft: selectedUser?.image ? '2.5rem' : '1rem' }}
            />
            {selectedUser && selectedUser.image && (
              <img 
                src={selectedUser.image} 
                alt="Avatar" 
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%' }} 
              />
            )}
            
            <input type="hidden" name="discordId" value={selectedUser?.discordId ?? ''} required />

            {/* Dropdown Results */}
            {open && (query.length >= 2) && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                background: '#18181b', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)', maxHeight: '250px', overflowY: 'auto'
              }}>
                {loading && <div style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Buscando...</div>}
                
                {!loading && results.length === 0 && (
                  <div style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Nenhum usuário encontrado que já tenha acessado o site.
                  </div>
                )}

                {!loading && results.map(user => (
                  <div key={user.discordId} onMouseDown={() => selectUser(user)} style={{
                    padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s'
                  }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {user.image ? (
                      <img src={user.image} alt="avatar" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                    ) : (
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--border)' }} />
                    )}
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {user.discordId}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary" style={{ width: "auto", whiteSpace: "nowrap" }} disabled={!selectedUser}>
            + Promover
          </button>
        </div>
      </form>

      {/* Lista de Admins com Botão de Remover */}
      <div className={styles.adminTagsWrap} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {allAdmins.map((a) => (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border)', borderRadius: 'var(--r-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem' }}>👤 {a.user?.name || a.discordId}</span>
              {a.addedBy === "SYSTEM" && (
                <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', background: 'rgba(220,38,38,0.2)', color: '#f87171', borderRadius: '4px', fontWeight: 'bold' }}>ROOT</span>
              )}
            </div>
            
            {a.addedBy !== "SYSTEM" && (
              <form action="/api/admin/demote" method="POST">
                <input type="hidden" name="discordId" value={a.discordId} />
                <button type="submit" title="Despromover / Remover" style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                  padding: '0.2rem', transition: 'color 0.2s'
                }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                  🗑️
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
