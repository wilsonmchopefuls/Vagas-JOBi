"use client";

import { useState } from 'react';
import s from './AdminJobActions.module.css';

export default function AdminJobActions({ jobId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleApprove = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('id', jobId);
      fd.append('action', 'APPROVE');
      
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        body: fd
      });
      if (res.ok) window.location.reload();
      else setError('Erro ao aprovar.');
    } catch (e) {
      console.error(e);
      setError('Erro interno.');
    }
    setLoading(false);
  };

  const handleReject = async () => {
    if (reason.trim().length < 20 || reason.trim().length > 200) {
      setError("O motivo deve ter entre 20 e 200 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('id', jobId);
      fd.append('action', 'REJECT');
      fd.append('reason', reason.trim());
      
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        body: fd
      });
      if (res.ok) window.location.reload();
      else setError('Erro ao rejeitar.');
    } catch (e) {
      console.error(e);
      setError('Erro interno.');
    }
    setLoading(false);
  };

  return (
    <div className={s.actionsWrap}>
      <button 
        type="button" 
        className={s.btnApprove} 
        onClick={handleApprove}
        disabled={loading}
      >
        ✅ Aprovar
      </button>
      <button 
        type="button" 
        className={s.btnReject} 
        onClick={() => setIsModalOpen(true)}
        disabled={loading}
      >
        ❌ Rejeitar
      </button>

      {isModalOpen && (
        <div className={s.modalOverlay}>
          <div className={s.modalContent}>
            <h3>Motivo da Recusa</h3>
            <p>Explique por que esta postagem foi rejeitada. O usuário receberá esta mensagem.</p>
            
            <textarea 
              className={s.textarea}
              placeholder="Ex: A vaga não contém informações suficientes sobre a empresa..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              maxLength={200}
            />
            
            <div className={s.charCount}>
              <span style={{ color: reason.length < 20 || reason.length > 200 ? '#ef4444' : 'inherit' }}>
                {reason.length}
              </span>
              / 200 (mín: 20)
            </div>

            {error && <div className={s.errorMsg}>{error}</div>}

            <div className={s.modalActions}>
              <button 
                type="button" 
                className={s.btnCancel} 
                onClick={() => setIsModalOpen(false)}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className={s.btnRejectConfirm} 
                onClick={handleReject}
                disabled={loading || reason.trim().length < 20 || reason.trim().length > 200}
              >
                {loading ? 'Processando...' : 'Confirmar Recusa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
