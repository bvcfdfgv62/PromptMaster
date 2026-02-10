import { z } from "zod";
import { PromptType } from "../types";

export const UUIDSchema = z.string().uuid();

export const CreditUpdateSchema = z.object({
    id: UUIDSchema,
    amount: z.number().int(),
});

export const UserUpdateSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export const PromptEntrySchema = z.object({
    id: UUIDSchema,
    user_id: UUIDSchema,
    type: z.nativeEnum(PromptType),
    prompt: z.string().min(1, "Prompt cannot be empty"),
    output: z.string(),
    timestamp: z.union([z.number(), z.string()]).optional(),
});

export const SignUpSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string().min(2, "Name must be at least 2 characters"),
});

export const SignInSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export const EmailSchema = z.object({
    email: z.string().email("Invalid email format"),
});

export const PromptGenerationSchema = z.object({
    type: z.nativeEnum(PromptType),
    description: z.string().min(10, "Description must be at least 10 characters long"),
    userId: UUIDSchema,
});
