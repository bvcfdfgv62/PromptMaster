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

            const { data: authData, error: authError } = await supabase!.auth.signUp({
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

            const { data, error } = await supabase!.auth.signInWithPassword({
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
            const { error } = await supabase!.auth.signOut();
            if (error) throw error;
            logger.info("User signed out successfully");
        } catch (error: any) {
            logError("Signout failed", error);
            throw error;
        }
    },

    getCurrentUser: async (): Promise<User | null> => {
        try {
            const { data: { user } } = await supabase!.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase!
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
