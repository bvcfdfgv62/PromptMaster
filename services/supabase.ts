import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Inicializa o cliente apenas se as credenciais existirem
// Isso permite que o app rode em modo "Mock" caso as keys não tenham sido inseridas ainda
export const isCloudActive = !!(supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL');

export const supabase = isCloudActive
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

if (!supabase) {
    console.warn("SaaS Mode: Supabase credentials missing. Operating in Local Persistence mode.");
}
