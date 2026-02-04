import { User, PromptEntry, SystemMetrics, UserUpdateParams } from "../types";
import { supabase } from "./supabase";

if (!supabase) {
  throw new Error("Supabase client is not initialized. Please check your environment variables.");
}

export const db = {
  init: async () => {
    console.log("Enterprise Mode: Supabase Engine Active ✅");
  },

  // --- User Services ---

  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return (data || []) as User[];
  },

  getUserByEmail: async (email: string): Promise<User | undefined> => {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    return data || undefined;
  },

  updateUserCredits: async (id: string, amount: number): Promise<User> => {
    const { data: user } = await supabase.from('users').select('credits').eq('id', id).single();
    const newBalance = (user?.credits || 0) + amount;
    if (newBalance < 0) throw new Error("Saldo insuficiente.");

    const { data, error } = await supabase.from('users').update({ credits: newBalance }).eq('id', id).select().single();
    if (error) throw error;
    return data as User;
  },

  savePromptHistory: async (entry: Omit<PromptEntry, "id" | "timestamp">): Promise<PromptEntry> => {
    const { data, error } = await supabase.from('prompt_history').insert({
      user_id: entry.user_id,
      type: entry.type,
      prompt: entry.prompt,
      output: entry.output
    }).select().single();
    if (error) throw error;
    return data as PromptEntry;
  },

  getUserHistory: async (userId: string): Promise<PromptEntry[]> => {
    const { data, error } = await supabase.from('prompt_history').select('*').eq('user_id', userId).order('timestamp', { ascending: false });
    if (error) throw error;
    return (data || []) as PromptEntry[];
  },

  updateUserProfile: async (id: string, updates: UserUpdateParams): Promise<User> => {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;

    const { data, error } = await supabase.from('users').update(dbUpdates).eq('id', id).select().single();
    if (error) throw error;
    return data as User;
  },

  deleteUser: async (id: string): Promise<void> => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  },

  getSystemMetrics: async (): Promise<SystemMetrics> => {
    const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).neq('role', 'ADMIN');
    const { count: promptsCount } = await supabase.from('prompt_history').select('*', { count: 'exact', head: true });
    const { data: creditsData } = await supabase.from('users').select('credits').neq('role', 'ADMIN');

    return {
      totalUsers: usersCount || 0,
      totalCredits: creditsData?.reduce((acc, curr) => acc + curr.credits, 0) || 0,
      totalPrompts: promptsCount || 0,
      activeUsers: usersCount || 0
    };
  }
};