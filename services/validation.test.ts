import { describe, it, expect } from 'vitest';
import {
    UserSchema,
    PromptTypeSchema,
    EmailSchema,
    PasswordSchema,
    UUIDSchema,
    CreditAmountSchema,
    UserUpdateSchema,
    SignUpSchema,
    SignInSchema
} from './validation';

describe('Validation Schemas', () => {
    describe('UserSchema', () => {
        it('should validate a correct user', () => {
            const validUser = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'John Doe',
                email: 'john@example.com',
                credits: 10,
                role: 'USER' as const
            };

            expect(() => UserSchema.parse(validUser)).not.toThrow();
        });

        it('should reject invalid email', () => {
            const invalidUser = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'John Doe',
                email: 'invalid-email',
                credits: 10,
                role: 'USER' as const
            };

            expect(() => UserSchema.parse(invalidUser)).toThrow('Email inválido');
        });

        it('should reject negative credits', () => {
            const invalidUser = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'John Doe',
                email: 'john@example.com',
                credits: -5,
                role: 'USER' as const
            };

            expect(() => UserSchema.parse(invalidUser)).toThrow();
        });

        it('should reject name that is too short', () => {
            const invalidUser = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'J',
                email: 'john@example.com',
                credits: 10,
                role: 'USER' as const
            };

            expect(() => UserSchema.parse(invalidUser)).toThrow();
        });
    });

    describe('PromptTypeSchema', () => {
        it('should accept valid prompt types', () => {
            expect(() => PromptTypeSchema.parse('Site')).not.toThrow();
            expect(() => PromptTypeSchema.parse('SaaS')).not.toThrow();
        });

        it('should reject invalid prompt type', () => {
            expect(() => PromptTypeSchema.parse('Invalid')).toThrow();
        });
    });

    describe('EmailSchema', () => {
        it('should accept valid email', () => {
            expect(() => EmailSchema.parse('test@example.com')).not.toThrow();
        });

        it('should reject invalid email', () => {
            expect(() => EmailSchema.parse('not-an-email')).toThrow();
        });

        it('should lowercase email', () => {
            const result = EmailSchema.parse('TEST@EXAMPLE.COM');
            expect(result).toBe('test@example.com');
        });
    });

    describe('PasswordSchema', () => {
        it('should accept valid password', () => {
            expect(() => PasswordSchema.parse('Password123')).not.toThrow();
        });

        it('should reject password that is too short', () => {
            expect(() => PasswordSchema.parse('Pass1')).toThrow();
        });

        it('should reject password without uppercase', () => {
            expect(() => PasswordSchema.parse('password123')).toThrow();
        });

        it('should reject password without lowercase', () => {
            expect(() => PasswordSchema.parse('PASSWORD123')).toThrow();
        });

        it('should reject password without number', () => {
            expect(() => PasswordSchema.parse('Password')).toThrow();
        });
    });

    describe('UUIDSchema', () => {
        it('should accept valid UUID', () => {
            expect(() => UUIDSchema.parse('123e4567-e89b-12d3-a456-426614174000')).not.toThrow();
        });

        it('should reject invalid UUID', () => {
            expect(() => UUIDSchema.parse('not-a-uuid')).toThrow();
        });
    });

    describe('CreditAmountSchema', () => {
        it('should accept positive integer', () => {
            expect(() => CreditAmountSchema.parse(10)).not.toThrow();
        });

        it('should accept negative integer', () => {
            expect(() => CreditAmountSchema.parse(-5)).not.toThrow();
        });

        it('should reject zero', () => {
            expect(() => CreditAmountSchema.parse(0)).toThrow();
        });

        it('should reject non-integer', () => {
            expect(() => CreditAmountSchema.parse(10.5)).toThrow();
        });
    });

    describe('UserUpdateSchema', () => {
        it('should accept name update', () => {
            expect(() => UserUpdateSchema.parse({ name: 'New Name' })).not.toThrow();
        });

        it('should accept password update', () => {
            expect(() => UserUpdateSchema.parse({ password: 'NewPass123' })).not.toThrow();
        });

        it('should accept both name and password', () => {
            expect(() => UserUpdateSchema.parse({ name: 'New Name', password: 'NewPass123' })).not.toThrow();
        });

        it('should reject empty object', () => {
            expect(() => UserUpdateSchema.parse({})).toThrow();
        });
    });

    describe('SignUpSchema', () => {
        it('should accept valid signup data', () => {
            const validData = {
                email: 'test@example.com',
                password: 'Password123',
                name: 'Test User'
            };

            expect(() => SignUpSchema.parse(validData)).not.toThrow();
        });

        it('should reject invalid email', () => {
            const invalidData = {
                email: 'invalid',
                password: 'Password123',
                name: 'Test User'
            };

            expect(() => SignUpSchema.parse(invalidData)).toThrow();
        });
    });

    describe('SignInSchema', () => {
        it('should accept valid signin data', () => {
            const validData = {
                email: 'test@example.com',
                password: 'anypassword'
            };

            expect(() => SignInSchema.parse(validData)).not.toThrow();
        });

        it('should reject empty password', () => {
            const invalidData = {
                email: 'test@example.com',
                password: ''
            };

            expect(() => SignInSchema.parse(invalidData)).toThrow();
        });
    });
});
