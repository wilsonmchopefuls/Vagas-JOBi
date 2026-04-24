/**
 * form-config.service.js
 * Gerencia as opções customizáveis dos formulários de vagas e freelas.
 * Defaults são focados em TI — admins podem sobrescrever por nicho.
 */
import prisma from '../lib/prisma.js';

// ─── Chaves válidas ───────────────────────────────────────────────────────────
export const FORM_CONFIG_KEYS = [
  'job_levels',
  'job_regimes',
  'edu_institutions',
  'edu_courses',
  'edu_levels',
];

// ─── Padrões TI (fallback quando não há customização) ────────────────────────
export const FORM_DEFAULTS = {
  job_levels: ['Estágio', 'Júnior', 'Pleno', 'Sênior', 'Especialista'],
  job_regimes: ['CLT', 'PJ', 'Freelancer', 'Outro'],
  edu_institutions: [
    'FIAP', 'SPTECH', 'USP', 'UNICAMP', 'UNESP', 'FGV', 'PUC-SP', 'PUC-MG', 'PUC-RS',
    'SENAC', 'SENAI', 'FATEC', 'ETEC', 'Mackenzie', 'FEI', 'FAAP', 'Insper',
    'UFMG', 'UFRJ', 'UFSC', 'UFPR', 'UFBA', 'UFC', 'UFPE', 'UFAM', 'UFPA',
    'UnB', 'UFRGS', 'UNIFESP', 'UFSCAR', 'UTFPR', 'UFRN', 'UFPB', 'UFES',
    'Anhanguera', 'Unopar', 'Uninter', 'Cruzeiro do Sul', 'Estácio', 'Uninove',
    'Unip', 'Belas Artes', 'Impacta', 'Descomplica', 'IFSP', 'IFSC', 'IFPR',
    'XP Educação', 'Rocketseat', 'DIO', 'Alura',
  ],
  edu_courses: [
    'Análise e Desenvolvimento de Sistemas', 'Ciência da Computação',
    'Engenharia de Software', 'Engenharia da Computação', 'Sistemas de Informação',
    'Desenvolvimento Web', 'Desenvolvimento Mobile', 'Ciência de Dados',
    'Inteligência Artificial', 'Banco de Dados', 'Redes de Computadores',
    'Segurança da Informação', 'Gestão de TI', 'Design Digital',
    'UX/UI Design', 'Marketing Digital', 'Gestão de Projetos', 'DevOps',
  ],
  edu_levels: [
    'Ensino Médio Técnico', 'Tecnólogo (Superior de Tecnologia)', 'Bacharelado',
    'Licenciatura', 'MBA / Pós-graduação', 'Mestrado', 'Doutorado', 'Bootcamp / Curso Livre',
  ],
};

/**
 * Retorna a config completa do formulário.
 * Para cada chave, usa customização do banco se existir, senão usa o padrão TI.
 */
export async function getAllFormConfig() {
  const records = await prisma.formConfig.findMany();
  const result = {};
  for (const key of FORM_CONFIG_KEYS) {
    const custom = records.find(r => r.key === key);
    result[key] = Array.isArray(custom?.options) && custom.options.length > 0
      ? custom.options
      : FORM_DEFAULTS[key];
  }
  return result;
}

/**
 * Retorna a config com metadados (customizado ou padrão) — para a UI admin.
 */
export async function getAllFormConfigWithMeta() {
  const records = await prisma.formConfig.findMany();
  const result = {};
  for (const key of FORM_CONFIG_KEYS) {
    const custom = records.find(r => r.key === key);
    const isCustom = Array.isArray(custom?.options) && custom.options.length > 0;
    result[key] = {
      options:   isCustom ? custom.options : FORM_DEFAULTS[key],
      isCustom,
      updatedAt: custom?.updatedAt ?? null,
    };
  }
  return result;
}

/**
 * Salva opções customizadas para uma chave.
 */
export async function setFormConfigKey(key, options) {
  if (!FORM_CONFIG_KEYS.includes(key)) {
    throw new Error('Categoria inválida.');
  }
  if (!Array.isArray(options) || options.length < 1) {
    throw new Error('A lista precisa ter pelo menos 1 opção.');
  }
  const clean = options
    .map(o => String(o).trim().replace(/[<>"']/g, ''))
    .filter(o => o.length > 0 && o.length <= 100);
  if (clean.length === 0) {
    throw new Error('Nenhuma opção válida fornecida.');
  }
  await prisma.formConfig.upsert({
    where:  { key },
    update: { options: clean },
    create: { key, options: clean },
  });
  return clean;
}

/**
 * Reseta uma chave ao padrão de fábrica (remove do banco).
 */
export async function resetFormConfigKey(key) {
  if (!FORM_CONFIG_KEYS.includes(key)) {
    throw new Error('Categoria inválida.');
  }
  await prisma.formConfig.deleteMany({ where: { key } });
}
