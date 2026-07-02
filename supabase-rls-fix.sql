-- ============================================================
-- Supabase RLS Fix: Allow authenticated users to insert/update
-- their own profile row in the `users` table.
-- Run this in your Supabase SQL Editor:
--   https://supabase.com/dashboard/project/saoqryectqrnuhoskvwc
-- ============================================================

-- 1. Enable RLS on users table (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Allow users to insert their own profile (matching auth.uid)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 3. Allow users to select their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- 4. Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. (Optional) Allow service_role to manage all rows (for admin/backend use)
DROP POLICY IF EXISTS "Service role can manage all" ON public.users;
CREATE POLICY "Service role can manage all"
ON public.users
FOR ALL
USING (true)
WITH CHECK (true);