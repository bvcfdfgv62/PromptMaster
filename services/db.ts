import { User, PromptEntry, SystemMetrics, UserUpdateParams } from "../types";
import { supabase } from "./supabase";

const DB_KEY = "PROMPT_MASTER_DB_V1";
const HISTORY_KEY = "PROMPT_MASTER_HISTORY_V1";
const SIMULATED_LATENCY_MS = 300;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Mock / Local Fallback Helpers ---
const getLocalData = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const setLocalData = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const db = {
  init: async () => {
    if (supabase) {
      console.log("Big Tech Mode: Connected to Enterprise Cloud (Supabase)");
      return;
    }
    // Fallback logic for Local Mode
    const users = getLocalData<User[]>(DB_KEY, []);
    if (!users.find(u => u.role === 'ADMIN')) {
      users.unshift({
        id: "admin-001",
        name: "Marina Admin",
        email: "marina@gmail.com",
        password: "202020",
        credits: 999999,
        role: "ADMIN"
      });
      setLocalData(DB_KEY, users);
    }
  },

  // --- User Services ---

  getUsers: async (): Promise<User[]> => {
    if (supabase) {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return data as User[];
    }
    await delay(SIMULATED_LATENCY_MS);
    return getLocalData<User[]>(DB_KEY, []);
  },

  getUserByEmail: async (email: string): Promise<User | undefined> => {
    if (supabase) {
      const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || undefined;
    }
    await delay(SIMULATED_LATENCY_MS);
    const users = getLocalData<User[]>(DB_KEY, []);
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  createUser: async (userData: Omit<User, "id" | "credits" | "role">): Promise<User> => {
    if (supabase) {
      const { data, error } = await supabase.from('users').insert({
        ...userData,
        password_hash: userData.password, // For simulation completeness
        credits: 10,
        role: 'USER'
      }).select().single();
      if (error) throw error;
      return data as User;
    }

    await delay(SIMULATED_LATENCY_MS);
    const users = getLocalData<User[]>(DB_KEY, []);
    if (users.find(u => u.email === userData.email)) throw new Error("Email já cadastrado.");

    const newUser: User = { ...userData, id: crypto.randomUUID(), credits: 10, role: "USER" };
    users.push(newUser);
    setLocalData(DB_KEY, users);
    return newUser;
  },

  updateUserCredits: async (id: string, amount: number): Promise<User> => {
    if (supabase) {
      // In Big Tech architecture, we'd use a RPC or specialized service to ensure atomic updates
      const { data: user } = await supabase.from('users').select('credits').eq('id', id).single();
      const newBalance = (user?.credits || 0) + amount;
      if (newBalance < 0) throw new Error("Saldo insuficiente.");

      const { data, error } = await supabase.from('users').update({ credits: newBalance }).eq('id', id).select().single();
      if (error) throw error;
      return data as User;
    }

    const users = getLocalData<User[]>(DB_KEY, []);
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error("Usuário não encontrado.");

    const newBalance = users[index].credits + amount;
    if (newBalance < 0) throw new Error("Saldo insuficiente.");

    users[index].credits = newBalance;
    setLocalData(DB_KEY, users);
    return users[index];
  },

  savePromptHistory: async (entry: Omit<PromptEntry, "id" | "timestamp">): Promise<PromptEntry> => {
    if (supabase) {
      const { data, error } = await supabase.from('prompt_history').insert(entry).select().single();
      if (error) throw error;
      return data as PromptEntry;
    }

    const history = getLocalData<PromptEntry[]>(HISTORY_KEY, []);
    const newEntry: PromptEntry = { ...entry, id: crypto.randomUUID(), timestamp: Date.now() };
    history.unshift(newEntry);
    setLocalData(HISTORY_KEY, history);
    return newEntry;
  },

  getUserHistory: async (userId: string): Promise<PromptEntry[]> => {
    if (supabase) {
      const { data, error } = await supabase.from('prompt_history').select('*').eq('user_id', userId).order('timestamp', { ascending: false });
      if (error) throw error;
      return data as PromptEntry[];
    }
    await delay(SIMULATED_LATENCY_MS);
    const history = getLocalData<PromptEntry[]>(HISTORY_KEY, []);
    return history.filter(h => h.userId === userId);
  },

  updateUserProfile: async (id: string, updates: UserUpdateParams): Promise<User> => {
    if (supabase) {
      const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as User;
    }
    await delay(SIMULATED_LATENCY_MS);
    const users = getLocalData<User[]>(DB_KEY, []);
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error("Usuário não encontrado.");
    if (updates.name) users[index].name = updates.name;
    if (updates.password && updates.password.trim() !== "") users[index].password = updates.password;
    setLocalData(DB_KEY, users);
    return users[index];
  },

  deleteUser: async (id: string): Promise<void> => {
    if (supabase) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    await delay(SIMULATED_LATENCY_MS);
    let users = getLocalData<User[]>(DB_KEY, []);
    users = users.filter(u => u.id !== id);
    setLocalData(DB_KEY, users);
  },

  getSystemMetrics: async (): Promise<SystemMetrics> => {
    if (supabase) {
      const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).neq('role', 'ADMIN');
      const { count: promptsCount } = await supabase.from('prompt_history').select('*', { count: 'exact', head: true });
      const { data: creditsData } = await supabase.from('users').select('credits').neq('role', 'ADMIN');

      return {
        totalUsers: usersCount || 0,
        totalCredits: creditsData?.reduce((acc, curr) => acc + curr.credits, 0) || 0,
        totalPrompts: promptsCount || 0,
        activeUsers: usersCount || 0 // Simplified for mock
      };
    }
    const users = getLocalData<User[]>(DB_KEY, []);
    const history = getLocalData<PromptEntry[]>(HISTORY_KEY, []);
    const realUsers = users.filter(u => u.role !== 'ADMIN');
    return {
      totalUsers: realUsers.length,
      totalCredits: realUsers.reduce((acc, curr) => acc + curr.credits, 0),
      totalPrompts: history.length,
      activeUsers: new Set(history.map(h => h.userId)).size
    };
  }
};