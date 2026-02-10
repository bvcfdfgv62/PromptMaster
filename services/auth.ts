import { supabase } from "./supabase";
import { User } from "../types";
import { SignUpSchema, SignInSchema, EmailSchema } from "./validation";
import { logger, logUserAction, logError, logSecurityEvent } from "./logger";

export const auth = {
    signUp: async (email: string, password: string, name: string) => {
        // Validation
        const validated = SignUpSchema.parse({ email, password, name });

        try {
            logger.info("User signup attempt", { email: validated.email });

            if (!supabase) {
                logger.warn("Supabase not initialized. Using LOCAL MOCK mode.");
                const mockUser: User = {
                    id: crypto.randomUUID(),
                    email: validated.email,
                    name: validated.name,
                    credits: 10,
                    role: 'USER',
                    created_at: new Date().toISOString()
                };
                // Simulate delay
                await new Promise(resolve => setTimeout(resolve, 500));

                logUserAction("User signed up (Local)", mockUser.id, { email: validated.email });
                return mockUser;
            }

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: validated.email,
                password: validated.password,
                options: {
                    data: {
                        full_name: validated.name,
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Falha ao criar usuário.");

            logUserAction("User signed up", authData.user.id, { email: validated.email });

            return authData.user;
        } catch (error: any) {
            logError("Signup failed", error, { email: validated.email });
            logSecurityEvent("Failed signup attempt", "medium", { email: validated.email, error: error.message });
            throw error;
        }
    },

    signIn: async (email: string, password: string) => {
        // Validation
        const validated = SignInSchema.parse({ email, password });

        try {
            logger.info("User signin attempt", { email: validated.email });

            if (!supabase) {
                logger.warn("Supabase not initialized. Using LOCAL MOCK mode.");
                // Simulate delay
                await new Promise(resolve => setTimeout(resolve, 500));

                // Allow any login in local mode
                const mockData = {
                    user: {
                        id: "123e4567-e89b-42d3-a456-426614174000",
                        email: validated.email,
                        role: "USER"
                    },
                    session: { access_token: "mock-token" }
                };

                logUserAction("User signed in (Local)", mockData.user.id, { email: validated.email });
                return mockData;
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email: validated.email,
                password: validated.password,
            });

            if (error) throw error;

            logUserAction("User signed in", data.user.id, { email: validated.email });

            return data;
        } catch (error: any) {
            logError("Signin failed", error, { email: validated.email });
            logSecurityEvent("Failed signin attempt", "medium", { email: validated.email, error: error.message });
            throw error;
        }
    },

    signOut: async () => {
        try {
            logger.info("User signout attempt");
            if (!supabase) {
                logger.warn("Supabase not initialized. Local signout.");
                return;
            }
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            logger.info("User signed out successfully");
        } catch (error: any) {
            logError("Signout failed", error);
            throw error;
        }
    },

    getCurrentUser: async (): Promise<User | null> => {
        try {
            if (!supabase) {
                // In local mode, we rely on localStorage which is handled in App.tsx
                // This method is for verifying session with server
                return null;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) return null;

            logger.debug("Current user fetched", { userId: user.id });

            return data as User;
        } catch (error: any) {
            logError("Failed to get current user", error);
            return null;
        }
    }
};
