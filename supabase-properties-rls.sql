-- ============================================================
-- Supabase RLS Fix: Properties Table
-- Run this in your Supabase SQL Editor to allow property posting
-- ============================================================

-- 1. Enable RLS on the properties table
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 2. Allow anyone to view active properties
DROP POLICY IF EXISTS "Public can view properties" ON public.properties;
CREATE POLICY "Public can view properties"
ON public.properties
FOR SELECT
USING (true);

-- 3. Allow authenticated users to INSERT their own properties
DROP POLICY IF EXISTS "Users can insert own properties" ON public.properties;
CREATE POLICY "Users can insert own properties"
ON public.properties
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- 4. Allow users to UPDATE their own properties
DROP POLICY IF EXISTS "Users can update own properties" ON public.properties;
CREATE POLICY "Users can update own properties"
ON public.properties
FOR UPDATE
USING (auth.uid() = owner_id);

-- 5. Allow users to DELETE their own properties
DROP POLICY IF EXISTS "Users can delete own properties" ON public.properties;
CREATE POLICY "Users can delete own properties"
ON public.properties
FOR DELETE
USING (auth.uid() = owner_id);
