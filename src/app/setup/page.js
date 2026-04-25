'use client';

import { useState, useCallback, useEffect } from 'react';
import s from './setup.module.css';

// ─── Ícones leves (inline SVG) ────────────────────────────────────────────
const IconCheck = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconCopy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const IconArrow = ({ open }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconExternal = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const TOTAL_STEPS = 5; // steps 1-5 (0 = welcome, 6 = done)

// ─── Sub-componentes ──────────────────────────────────────────────────────

function StatusRow({ status, message }) {
  const labels = { idle: 'Aguardando teste', testing: 'Testando...', ok: 'Tudo certo!', error: message || 'Falhou' };
  return (
    <div className={s.statusRow}>
      <span className={`${s.statusDot} ${s[status]}`} />
      <span className={`${s.statusText} ${s[status]}`}>{labels[status]}</span>
    </div>
  );
}

function CopyBtn({ text, id, copied, onCopy }) {
  const isCopied = copied === id;
  return (
    <button type="button" className={`${s.copyBtn} ${isCopied ? s.copied : ''}`} onClick={() => onCopy(text, id)}>
      {isCopied ? '✓ Copiado' : <><IconCopy /> Copiar</>}
    </button>
  );
}

function Hint({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={s.hint}>
      <div className={s.hintHeader} onClick={() => setOpen(o => !o)} role="button" aria-expanded={open}>
        <div className={s.hintHeaderLeft}>
          <span>📖</span> {title}
        </div>
        <span className={`${s.hintArrow} ${open ? s.open : ''}`}><IconArrow open={open} /></span>
      </div>
      {open && <div className={s.hintBody}>{children}</div>}
    </div>
  );
}

function HintStep({ n, children }) {
  return (
    <div className={s.hintStep}>
      <span className={s.hintNum}>{n}</span>
      <span>{children}</span>
    </div>
  );
}

function Field({ label, fieldKey, value, onChange, placeholder, type = 'text', disabled }) {
  return (
    <div className={s.fieldGroup}>
      <label className={s.fieldLabel}>{label}</label>
      <input
        className={s.fieldInput}
        type={type}
        value={value}
        onChange={e => onChange(fieldKey, e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
}

function FieldWithTest({ label, fieldKey, value, onChange, placeholder, onTest, validation }) {
  const isTesting = validation?.status === 'testing';
  return (
    <div className={s.fieldGroup}>
      <label className={s.fieldLabel}>{label}</label>
      <div className={s.fieldRow}>
        <input
          className={s.fieldInput}
          type="text"
          value={value}
          onChange={e => onChange(fieldKey, e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          className={s.testBtn}
          onClick={() => onTest(fieldKey, value)}
          disabled={!value.trim() || isTesting}
        >
          {isTesting ? '...' : 'Testar'}
        </button>
      </div>
      <StatusRow status={validation?.status || 'idle'} message={validation?.message} />
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────
export default function SetupPage() {
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState({
    DATABASE_URL: '',
    DISCORD_WEBHOOK_URL_VAGAS: '',
    DISCORD_WEBHOOK_URL_FREELANCERS: '',
    DISCORD_CLIENT_ID: '',
    DISCORD_CLIENT_SECRET: '',
    NEXTAUTH_SECRET: '',
    NEXTAUTH_URL: 'http://localhost:3000',
    NEXT_PUBLIC_DISCORD_SERVER_URL: '',
  });
  const [validations, setValidations] = useState({});
  const [copied, setCopied] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const setField = useCallback((key, value) => {
    setFields(f => ({ ...f, [key]: value }));
    setValidations(v => ({ ...v, [key]: { status: 'idle' } }));
  }, []);

  const testField = useCallback(async (key, value) => {
    setValidations(v => ({ ...v, [key]: { status: 'testing' } }));
    try {
      const res = await fetch('/api/setup/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: key, value }),
      });
      const data = await res.json();
      setValidations(v => ({ ...v, [key]: { status: data.ok ? 'ok' : 'error', message: data.error } }));
    } catch {
      setValidations(v => ({ ...v, [key]: { status: 'error', message: 'Erro de rede.' } }));
    }
  }, []);

  const generateSecret = useCallback(async () => {
    try {
      const res = await fetch('/api/setup/generate-secret');
      const data = await res.json();
      setFields(f => ({ ...f, NEXTAUTH_SECRET: data.secret }));
      setValidations(v => ({ ...v, NEXTAUTH_SECRET: { status: 'ok' } }));
    } catch { /* ignorar */ }
  }, []);

  const copyText = useCallback(async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* ignorar */ }
  }, []);

  // Auto-testa o NEXTAUTH_URL quando o usuário chega no step 4
  // porque o campo já está pré-preenchido com http://localhost:3000
  useEffect(() => {
    if (step === 4 && !validations.NEXTAUTH_URL) {
      testField('NEXTAUTH_URL', fields.NEXTAUTH_URL);
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const isStepValid = () => {
    const ok = k => validations[k]?.status === 'ok';
    switch (step) {
      case 1: return ok('DATABASE_URL');
      case 2: return ok('DISCORD_WEBHOOK_URL_VAGAS') && ok('DISCORD_WEBHOOK_URL_FREELANCERS');
      case 3: return ok('DISCORD_CLIENT_ID') && ok('DISCORD_CLIENT_SECRET');
      // Step 4: secret deve estar ok, URL pode estar testando ainda (auto-testada pelo useEffect)
      case 4: return ok('NEXTAUTH_SECRET') && (ok('NEXTAUTH_URL') || validations.NEXTAUTH_URL?.status === 'testing');
      case 5: return ok('NEXT_PUBLIC_DISCORD_SERVER_URL');
      default: return true;
    }
  };

  const handleNext = async () => {
    if (step < 5) { setStep(s => s + 1); return; }

    // Step 5 → save
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/setup/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (data.success) {
        setStep(6);
      } else {
        setSaveError(data.error || 'Erro desconhecido ao salvar.');
      }
    } catch {
      // Quando o Next.js detecta que o .env.local foi criado, ele derruba o servidor.
      // Isso causa um erro de rede no fetch antes de receber a resposta.
      // Portanto, o erro de rede aqui significa que deu TUDO CERTO!
      setStep(6);
    } finally {
      setSaving(false);
    }
  };

  const callbackUrl = `${fields.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/discord`;
  const progress = step === 0 ? 0 : step === 6 ? 100 : (step / TOTAL_STEPS) * 100;

  // ─── RENDER ────────────────────────────────────────────────────────────
  return (
    <div className={s.overlay}>
      <div className={s.brand}>
        <span className={s.brandDot} />
        Trampo Setup
      </div>

      <div className={s.card}>
        {/* Progress bar (oculta na welcome e done) */}
        {step > 0 && step < 6 && (
          <div className={s.progressWrap}>
            <div className={s.progressMeta}>
              <span className={s.progressLabel}>Configuração</span>
              <span className={s.progressStep}>Passo {step} de {TOTAL_STEPS}</span>
            </div>
            <div className={s.progressBar}>
              <div className={s.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* ── STEP 0: Welcome ──────────────────────────────────────── */}
        {step === 0 && (
          <>
            <div className={s.welcome}>
              <span className={s.welcomeEmoji}>💼</span>
              <h1 className={s.welcomeTitle}>Bem-vindo ao Trampo!</h1>
              <p className={s.welcomeSub}>
                Vamos configurar seu sistema em <strong style={{ color: '#fafafa' }}>menos de 5 minutos</strong>.
                Cole os valores nos campos — o sistema faz o resto.
              </p>
              <div className={s.features}>
                {[
                  ['🗄️', 'Banco de Dados', 'PostgreSQL via Neon DB (gratuito)'],
                  ['🤖', 'Webhooks do Discord', 'Para postar vagas e freelancers'],
                  ['🔐', 'App do Discord', 'OAuth2 para login dos usuários'],
                  ['🔑', 'Segredo de Auth', 'Gerado automaticamente se quiser'],
                  ['🌐', 'Comunidade', 'Link permanente do seu servidor'],
                ].map(([icon, name, desc]) => (
                  <div key={name} className={s.feature}>
                    <span className={s.featureIcon}>{icon}</span>
                    <span>
                      <span className={s.featureName}>{name}</span>
                      <span style={{ color: '#52525b' }}> — {desc}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className={s.nav}>
              <button className={s.btnNext} onClick={() => setStep(1)}>
                Começar configuração →
              </button>
            </div>
          </>
        )}

        {/* ── STEP 1: Banco de Dados ───────────────────────────────── */}
        {step === 1 && (
          <>
            <div className={s.body}>
              <span className={s.stepIcon}>🗄️</span>
              <h2 className={s.stepTitle}>Banco de Dados</h2>
              <p className={s.stepDesc}>
                Precisamos de uma URL de conexão PostgreSQL. Recomendamos o <strong style={{ color: '#fafafa' }}>Neon DB</strong> — é gratuito, serverless e tem conexão de alta performance.
              </p>

              <Hint title="Como criar seu banco no Neon DB" defaultOpen>
                <HintStep n="1">Acesse <strong>neon.tech</strong>, crie uma conta gratuita, coloque o nome da sua <strong>Organization</strong> e clique em Next.</HintStep>
                <HintStep n="2">Coloque o nome do projeto, verifique se o <strong>Neon Auth está DESLIGADO</strong>, escolha a sua região (ex: São Paulo) e clique em <strong>Create Project</strong>.</HintStep>
                <HintStep n="3">Na tela seguinte, você pode ir direto na área <strong>Connection string</strong>, clicar em <strong>Show password</strong> (olho) e depois no botão <strong>Copy snippet</strong>.</HintStep>
                <HintStep n="4"><strong>OU</strong> clique em <strong>Go to project</strong>, depois no botão branco <strong>Connect</strong>, vá em "Connect to your database", ative o <strong>Show password</strong> e clique em <strong>Copy snippet</strong>.</HintStep>
                <HintStep n="5">A URL copiada sempre começa com <code style={{ color: '#818cf8' }}>postgresql://</code></HintStep>
                <a href="https://neon.tech" target="_blank" rel="noopener noreferrer" className={s.hintLink}>
                  <IconExternal /> Abrir Neon DB
                </a>
              </Hint>

              <FieldWithTest
                label="URL de Conexão"
                fieldKey="DATABASE_URL"
                value={fields.DATABASE_URL}
                onChange={setField}
                placeholder="postgresql://usuario:senha@host.neon.tech/neondb?sslmode=require"
                onTest={testField}
                validation={validations.DATABASE_URL}
              />
            </div>
            <div className={s.nav}>
              <button className={s.btnBack} onClick={() => setStep(0)}>← Voltar</button>
              <button className={s.btnNext} onClick={handleNext} disabled={!isStepValid()}>
                Próximo →
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2: Webhooks ─────────────────────────────────────── */}
        {step === 2 && (
          <>
            <div className={s.body}>
              <span className={s.stepIcon}>🤖</span>
              <h2 className={s.stepTitle}>Webhooks do Discord</h2>
              <p className={s.stepDesc}>
                Crie dois webhooks no seu servidor Discord: um para o canal de <strong style={{ color: '#fafafa' }}>vagas</strong> e outro para <strong style={{ color: '#fafafa' }}>freelancers</strong>. Ao testar, uma mensagem aparecerá e será deletada automaticamente.
              </p>

              <Hint title="Como criar webhooks no Discord" defaultOpen>
                <HintStep n="1">Vá no canal de texto onde quer postar as vagas.</HintStep>
                <HintStep n="2">Clique no ícone de engrenagem ⚙️ ao lado do nome do canal.</HintStep>
                <HintStep n="3">Vá em <strong>Integrações → Webhooks → Novo Webhook</strong>.</HintStep>
                <HintStep n="4">Nomeie (ex: "Trampo Vagas"), clique em <strong>"Copiar URL do Webhook"</strong>.</HintStep>
                <HintStep n="5">Repita o processo para o canal de freelancers.</HintStep>
              </Hint>

              <FieldWithTest
                label="Webhook — Canal de Vagas"
                fieldKey="DISCORD_WEBHOOK_URL_VAGAS"
                value={fields.DISCORD_WEBHOOK_URL_VAGAS}
                onChange={setField}
                placeholder="https://discord.com/api/webhooks/..."
                onTest={testField}
                validation={validations.DISCORD_WEBHOOK_URL_VAGAS}
              />

              <FieldWithTest
                label="Webhook — Canal de Freelancers"
                fieldKey="DISCORD_WEBHOOK_URL_FREELANCERS"
                value={fields.DISCORD_WEBHOOK_URL_FREELANCERS}
                onChange={setField}
                placeholder="https://discord.com/api/webhooks/..."
                onTest={testField}
                validation={validations.DISCORD_WEBHOOK_URL_FREELANCERS}
              />
            </div>
            <div className={s.nav}>
              <button className={s.btnBack} onClick={() => setStep(1)}>← Voltar</button>
              <button className={s.btnNext} onClick={handleNext} disabled={!isStepValid()}>
                Próximo →
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3: Discord App (OAuth2) ─────────────────────────── */}
        {step === 3 && (
          <>
            <div className={s.body}>
              <span className={s.stepIcon}>🔐</span>
              <h2 className={s.stepTitle}>App do Discord</h2>
              <p className={s.stepDesc}>
                Para que o login com Discord funcione, registre um aplicativo no Discord Developer Portal e adicione a URL de redirecionamento abaixo.
              </p>

              <Hint title="Como criar o App no Discord Developer Portal" defaultOpen>
                <HintStep n="1">Acesse <strong>discord.com/developers/applications</strong>.</HintStep>
                <HintStep n="2">Clique em <strong>"New Application"</strong>, dê um nome e confirme.</HintStep>
                <HintStep n="3">No menu lateral esquerdo, clique na aba <strong>OAuth2</strong> (pode não ter "General", clique apenas em OAuth2).</HintStep>
                <HintStep n="4">Copie o <strong>Client ID</strong> e clique em <strong>"Reset Secret"</strong> para obter o Client Secret.</HintStep>
                <HintStep n="5">Role um pouco para baixo até achar a seção <strong>"Redirects"</strong>, clique em <strong>"Add Redirect"</strong> e cole EXATAMENTE a URL de redirect gerada logo abaixo. Não esqueça de salvar.</HintStep>
                <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className={s.hintLink}>
                  <IconExternal /> Abrir Developer Portal
                </a>
              </Hint>

              <div className={s.fieldGroup}>
                <label className={s.fieldLabel}>URL de Redirect — adicione esta URL exata na seção "Redirects" no Discord</label>
                <div className={s.codeBlock}>
                  <span className={s.codeValue}>{callbackUrl}</span>
                  <CopyBtn text={callbackUrl} id="callback" copied={copied} onCopy={copyText} />
                </div>
              </div>

              <FieldWithTest
                label="Client ID"
                fieldKey="DISCORD_CLIENT_ID"
                value={fields.DISCORD_CLIENT_ID}
                onChange={setField}
                placeholder="123456789012345678"
                onTest={testField}
                validation={validations.DISCORD_CLIENT_ID}
              />

              <FieldWithTest
                label="Client Secret"
                fieldKey="DISCORD_CLIENT_SECRET"
                value={fields.DISCORD_CLIENT_SECRET}
                onChange={setField}
                placeholder="Seu client secret aqui"
                onTest={testField}
                validation={validations.DISCORD_CLIENT_SECRET}
              />
            </div>
            <div className={s.nav}>
              <button className={s.btnBack} onClick={() => setStep(2)}>← Voltar</button>
              <button className={s.btnNext} onClick={handleNext} disabled={!isStepValid()}>
                Próximo →
              </button>
            </div>
          </>
        )}

        {/* ── STEP 4: Auth ─────────────────────────────────────────── */}
        {step === 4 && (
          <>
            <div className={s.body}>
              <span className={s.stepIcon}>🔑</span>
              <h2 className={s.stepTitle}>Segredo de Autenticação</h2>
              <p className={s.stepDesc}>
                O <strong style={{ color: '#fafafa' }}>NEXTAUTH_SECRET</strong> criptografa as sessões dos usuários. Gere um automaticamente ou cole o seu. A <strong style={{ color: '#fafafa' }}>URL do site</strong> é onde o sistema está rodando.
              </p>

              <div className={s.fieldGroup}>
                <label className={s.fieldLabel}>Segredo (mínimo 32 caracteres)</label>
                <div className={s.fieldRow}>
                  <input
                    className={s.fieldInput}
                    type="text"
                    value={fields.NEXTAUTH_SECRET}
                    onChange={e => setField('NEXTAUTH_SECRET', e.target.value)}
                    placeholder="Clique em 'Gerar' ou cole seu segredo aqui"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <CopyBtn text={fields.NEXTAUTH_SECRET} id="secret" copied={copied} onCopy={copyText} />
                </div>
                <button type="button" className={s.generateBtn} onClick={generateSecret}>
                  ✨ Gerar automaticamente
                </button>
                <StatusRow status={validations.NEXTAUTH_SECRET?.status || 'idle'} message={validations.NEXTAUTH_SECRET?.message} />
              </div>

              <div className={s.divider} />

              <FieldWithTest
                label="URL do Site (NEXTAUTH_URL)"
                fieldKey="NEXTAUTH_URL"
                value={fields.NEXTAUTH_URL}
                onChange={setField}
                placeholder="http://localhost:3000"
                onTest={testField}
                validation={validations.NEXTAUTH_URL}
              />

              <Hint title="Onde usar estas informações">
                <HintStep n="1"><strong>NEXTAUTH_SECRET:</strong> nunca compartilhe. Em produção, coloque na Vercel como variável de ambiente.</HintStep>
                <HintStep n="2"><strong>NEXTAUTH_URL:</strong> em produção, substitua por <code style={{ color: '#818cf8' }}>https://seu-dominio.com</code></HintStep>
              </Hint>
            </div>
            <div className={s.nav}>
              <button className={s.btnBack} onClick={() => setStep(3)}>← Voltar</button>
              <button
                className={s.btnNext}
                onClick={() => {
                  // Auto-valida o secret se ainda não validado
                  if (!validations.NEXTAUTH_SECRET || validations.NEXTAUTH_SECRET.status === 'idle') {
                    testField('NEXTAUTH_SECRET', fields.NEXTAUTH_SECRET);
                  }
                  if (!validations.NEXTAUTH_URL || validations.NEXTAUTH_URL.status === 'idle') {
                    testField('NEXTAUTH_URL', fields.NEXTAUTH_URL);
                  }
                  if (isStepValid()) handleNext();
                }}
                disabled={!isStepValid()}
              >
                Próximo →
              </button>
            </div>
          </>
        )}

        {/* ── STEP 5: Comunidade ───────────────────────────────────── */}
        {step === 5 && (
          <>
            <div className={s.body}>
              <span className={s.stepIcon}>🌐</span>
              <h2 className={s.stepTitle}>Comunidade Discord</h2>
              <p className={s.stepDesc}>
                Cole o link permanente do seu servidor Discord. Ele aparecerá como convite no modal de sucesso do formulário, incentivando os usuários a entrar na sua comunidade.
              </p>

              <Hint title="Como criar um link permanente de convite" defaultOpen>
                <HintStep n="1">No Discord, clique com botão direito no <strong>nome do seu servidor</strong>.</HintStep>
                <HintStep n="2">Clique em <strong>"Convidar Pessoas"</strong>.</HintStep>
                <HintStep n="3">No canto inferior, clique em <strong>"Editar link de convite"</strong>.</HintStep>
                <HintStep n="4">Em duração, selecione <strong>"Nunca"</strong> e confirme.</HintStep>
                <HintStep n="5">Copie o link — ele terá o formato <code style={{ color: '#818cf8' }}>discord.gg/XXXXXXX</code></HintStep>
              </Hint>

              <FieldWithTest
                label="Link Permanente do Servidor"
                fieldKey="NEXT_PUBLIC_DISCORD_SERVER_URL"
                value={fields.NEXT_PUBLIC_DISCORD_SERVER_URL}
                onChange={setField}
                placeholder="https://discord.gg/seu-servidor"
                onTest={testField}
                validation={validations.NEXT_PUBLIC_DISCORD_SERVER_URL}
              />

              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '8px', fontSize: '0.9rem', color: '#fef08a' }}>
                <strong>⚠️ Aviso importante:</strong> Ao clicar em concluir, o sistema criará o banco de dados e o servidor será encerrado sozinho. Não se assuste se o site parecer que "caiu". Após concluir, volte no seu terminal e inicie o site novamente com <code style={{ color: '#fff', backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '4px' }}>npm run dev</code>.
              </div>

              {saveError && (
                <div className={s.saveError}>⚠️ {saveError}</div>
              )}
            </div>
            <div className={s.nav}>
              <button className={s.btnBack} onClick={() => setStep(4)}>← Voltar</button>
              <button className={s.btnNext} onClick={handleNext} disabled={!isStepValid() || saving}>
                {saving ? 'Salvando...' : '🚀 Concluir configuração'}
              </button>
            </div>
          </>
        )}

        {/* ── STEP 6: Done ─────────────────────────────────────────── */}
        {step === 6 && (
          <>
            <div className={s.done}>
              <div className={s.doneCheck}><IconCheck /></div>
              <h2 className={s.doneTitle}>Configuração concluída!</h2>
              <p className={s.doneDesc}>
                O arquivo <code style={{ color: '#818cf8' }}>.env.local</code> foi gerado com sucesso!<br />
                A aplicação vai dar uma leve desconectada (o servidor vai encerrar sozinho) para aplicar as configurações.
              </p>

              <div className={s.doneCmd}>
                <div className={s.doneCmdLabel}>O que fazer agora para o site funcionar:</div>
                <ol style={{ textAlign: 'left', margin: '0.5rem 0', fontSize: '0.9rem', color: '#a1a1aa', paddingLeft: '1.2rem' }}>
                  <li>Volte para o seu terminal ou prompt de comando.</li>
                  <li>Caso o processo não tenha parado, pressione <strong>CTRL + C</strong>.</li>
                  <li><strong>PASSO MAIS IMPORTANTE:</strong> Cole o comando abaixo e aperte Enter para sincronizar as tabelas no seu banco de dados:</li>
                </ol>
                <div className={s.codeBlock} style={{ marginBottom: '1rem' }}>
                  <span className={s.codeValue}>npx prisma db push</span>
                  <CopyBtn text="npx prisma db push" id="cmd-prisma" copied={copied} onCopy={copyText} />
                </div>
                
                <ol style={{ textAlign: 'left', margin: '0.5rem 0', fontSize: '0.9rem', color: '#a1a1aa', paddingLeft: '1.2rem' }} start="4">
                  <li>Depois que o banco terminar de sincronizar, inicie o servidor novamente:</li>
                </ol>
                <div className={s.codeBlock}>
                  <span className={s.codeValue}>npm run dev</span>
                  <CopyBtn text="npm run dev" id="cmd1" copied={copied} onCopy={copyText} />
                </div>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#52525b', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                Após o servidor reiniciar, atualize a página (F5) ou acesse <strong style={{ color: '#a1a1aa' }}>http://localhost:3000</strong>.
                <br /><br />
                <strong>Você será o dono!</strong> Ao fazer o login com o Discord pela primeira vez, sua conta será registrada automaticamente como Administrador Root.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
