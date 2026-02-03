-- PROMPT MASTER ENTERPRISE - SQL SCHEMA (BIG TECH READY)

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL, -- In a real system, Supabase Auth handles this, but we keep it for custom logic
    credits INTEGER DEFAULT 10 CHECK (credits >= 0),
    role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Prompt History Table
CREATE TABLE IF NOT EXISTS public.prompt_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    prompt TEXT NOT NULL,
    output TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- 3. Row Level Security (RLS) - The "Big Tech" Way
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_history ENABLE ROW LEVEL SECURITY;

-- Users can see their own data
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can see their own history
CREATE POLICY "Users can view own history" ON public.prompt_history
    FOR SELECT USING (auth.uid() = user_id);

-- 4. Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
