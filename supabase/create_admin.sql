-- RODE ESTE SCRIPT NO "SQL EDITOR" DO SEU DASHBOARD SUPABASE
-- Substitua 'seu-email@exemplo.com' pelo e-mail que você usou para se cadastrar

UPDATE public.users 
SET role = 'ADMIN', credits = 999999
WHERE email = 'marina@gmail.com';
