import { z } from 'zod';

/**
 * Validation Schemas for PromptMaster Enterprise
 * 
 * Following Big Tech standards:
 * - Explicit validation at all boundaries
 * - Clear error messages
 * - Type-safe schemas
 */

// --- Core Domain Schemas ---

export const UserSchema = z.object({
    id: z.string().uuid('ID deve ser um UUID válido'),
    name: z.string()
        .min(2, 'Nome deve ter no mínimo 2 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres')
        .trim(),
    email: z.string()
        .email('Email inválido')
        .toLowerCase()
        .trim(),
    credits: z.number()
        .int('Créditos devem ser um número inteiro')
        .min(0, 'Créditos não podem ser negativos'),
    role: z.enum(['ADMIN', 'USER']),
    created_at: z.string().datetime().optional()
});

export const PromptTypeSchema = z.enum(['Site', 'SaaS']);

export const PromptEntrySchema = z.object({
    id: z.string().uuid('ID deve ser um UUID válido'),
    user_id: z.string().uuid('User ID deve ser um UUID válido'),
    type: PromptTypeSchema,
    prompt: z.string()
        .min(10, 'Prompt deve ter no mínimo 10 caracteres')
        .max(5000, 'Prompt deve ter no máximo 5000 caracteres')
        .trim(),
    output: z.string()
        .min(1, 'Output não pode estar vazio')
        .trim(),
    timestamp: z.union([z.number(), z.string().datetime()])
});

// --- Input Validation Schemas ---

export const EmailSchema = z.string()
    .email('Email inválido')
    .toLowerCase()
    .trim();

export const PasswordSchema = z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número');

export const UUIDSchema = z.string().uuid('ID inválido');

export const CreditAmountSchema = z.number()
    .int('Quantidade deve ser um número inteiro')
    .refine(
        (val) => val !== 0,
        'Quantidade não pode ser zero'
    );

// --- Update Schemas ---

export const UserUpdateSchema = z.object({
    name: z.string()
        .min(2, 'Nome deve ter no mínimo 2 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres')
        .trim()
        .optional(),
    password: PasswordSchema.optional()
}).refine(
    (data) => data.name !== undefined || data.password !== undefined,
    'Pelo menos um campo deve ser fornecido para atualização'
);

export const CreditUpdateSchema = z.object({
    id: UUIDSchema,
    amount: CreditAmountSchema
});

// --- Auth Schemas ---

export const SignUpSchema = z.object({
    email: EmailSchema,
    password: PasswordSchema,
    name: z.string()
        .min(2, 'Nome deve ter no mínimo 2 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres')
        .trim()
});

export const SignInSchema = z.object({
    email: EmailSchema,
    password: z.string().min(1, 'Senha é obrigatória')
});

// --- Prompt Generation Schemas ---

export const PromptGenerationSchema = z.object({
    type: PromptTypeSchema,
    description: z.string()
        .min(10, 'Descrição deve ter no mínimo 10 caracteres')
        .max(2000, 'Descrição deve ter no máximo 2000 caracteres')
        .trim(),
    userId: UUIDSchema
});

// --- Type Exports ---

export type User = z.infer<typeof UserSchema>;
export type PromptEntry = z.infer<typeof PromptEntrySchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type CreditUpdate = z.infer<typeof CreditUpdateSchema>;
export type SignUp = z.infer<typeof SignUpSchema>;
export type SignIn = z.infer<typeof SignInSchema>;
export type PromptGeneration = z.infer<typeof PromptGenerationSchema>;
