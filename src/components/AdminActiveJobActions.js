'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './AdminJobActions.module.css';

export default function AdminActiveJobActions({ jobId }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const getCsrfToken = () => {
    return document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1] || '';
  };

  const handleDelete = async () => {
    if (reason.length < 20 || reason.length > 200) {
      alert('A justificativa deve ter entre 20 e 200 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('id', jobId);
      formData.append('action', 'DELETE');
      formData.append('reason', reason);

      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'x-csrf-token': getCsrfToken() },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao deletar postagem.');
      }

      router.refresh(); // recarrega a lista do admin
    } catch (err) {
      alert(err.message);
      setLoading(false);
    }
  };

  if (isDeleting) {
    return (
      <div style={{ marginTop: '1rem' }}>
        <p style={{ fontSize: '0.8rem', color: '#f87171', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          ⚠️ Isso excluirá a postagem do site E do Discord.
        </p>
        <textarea
          className={styles.textarea}
          placeholder="Justificativa (enviada via notificação, min 20 caracteres)..."
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={2}
          maxLength={200}
        />
        <div className={styles.modalActions}>
          <button className={styles.btnCancel} onClick={() => setIsDeleting(false)} disabled={loading}>
            Cancelar
          </button>
          <button className={styles.btnRejectConfirm} onClick={handleDelete} disabled={loading || reason.length < 20}>
            {loading ? 'Deletando...' : 'Confirmar Exclusão'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.actionsWrap}>
      <button className={styles.btnReject} onClick={() => setIsDeleting(true)}>
        🗑️ Excluir do Mural e Discord
      </button>
    </div>
  );
}
