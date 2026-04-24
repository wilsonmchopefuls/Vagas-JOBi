import { z } from 'zod';

// Regex para Snowflake ID do Discord (17 a 20 dígitos numéricos)
const snowflake = z.string().regex(/^\d{17,20}$/, 'ID do Discord inválido. Deve ser um número com 17-20 dígitos.');

// Campos de texto com limites seguros
const shortText  = (label) => z.string().min(2, `${label} é obrigatório.`).max(100, `${label} muito longo (máx 100 caracteres).`).trim();
const longText   = (label) => z.string().min(10, `${label} muito curto.`).max(2000, `${label} muito longo (máx 2000 caracteres).`).trim();
const contactText = z.string().min(3, 'Contato é obrigatório.').max(300, 'Contato muito longo.').trim();

// Schema para publicar vaga
export const vagaSchema = z.object({
  type:        z.literal('vagas'),
  title:       shortText('Título da vaga'),
  company:     shortText('Nome da empresa'),
  level:       z.enum(['Estágio', 'Júnior', 'Pleno', 'Sênior', 'Especialista'], { message: 'Nível inválido.' }),
  regime:      z.enum(['CLT', 'PJ', 'Freelancer', 'Outro'], { message: 'Regime inválido.' }),
  description: longText('Descrição'),
  contact:     contactText,
});

const educationEntry = z.object({
  institution: z.string().max(150).trim().optional().default(''),
  course:      z.string().max(150).trim().optional().default(''),
  level:       z.string().max(100).trim().optional().default(''),
  status:      z.enum(['Cursando', 'Concluído', 'Trancado']).optional().default('Cursando'),
});

// Schema para publicar freela
export const freelaSchema = z.object({
  type:        z.literal('freelancers'),
  title:       shortText('Título profissional'),
  company:     shortText('Seu nome'),
  skills:      longText('Habilidades'),
  portfolio:   z.string().min(3, 'Portfólio é obrigatório.').max(500, 'Portfólio muito longo.').trim(),
  availability: z.string().max(200).trim().optional().default('A combinar'),
  contact:     contactText,
  educations:  z.array(educationEntry).max(3).optional().default([]),
});

// Schema unificado (discrimina pelo campo 'type')
export const jobSchema = z.discriminatedUnion('type', [vagaSchema, freelaSchema]);

// Schema para promover admin
export const promoteSchema = z.object({
  discordId: snowflake,
});

// Schema para ação de moderação
export const moderationActionSchema = z.object({
  id:     z.string().cuid('ID de postagem inválido.'),
  action: z.enum(['APPROVE', 'REJECT'], { message: 'Ação inválida.' }),
});
