import { supabase } from "./supabase";
import { User } from "../types";

export const auth = {
    signUp: async (email: string, password: string, name: string) => {
        const { data: authData, error: authError } = await supabase!.auth.signUp({
            email,
            password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Falha ao criar usuário.");

        // O trigger no banco poderia fazer isso, mas garantimos aqui por segurança
        const { error: profileError } = await supabase!
            .from('users')
            .insert({
                id: authData.user.id,
                email,
                name,
                credits: 10,
                role: 'USER'
            });

        if (profileError) throw profileError;

        return authData.user;
    },

    signIn: async (email: string, password: string) => {
        const { data, error } = await supabase!.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return data;
    },

    signOut: async () => {
        const { error } = await supabase!.auth.signOut();
        if (error) throw error;
    },

    getCurrentUser: async (): Promise<User | null> => {
        const { data: { user } } = await supabase!.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase!
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) return null;
        return data as User;
    }
};
