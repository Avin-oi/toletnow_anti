-- ============================================================
-- Create `contacts` table for storing contact form submissions.
-- Run this in your Supabase SQL Editor if the table doesn't exist.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contacts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Allow public inserts (contact form is open to everyone)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contacts;
CREATE POLICY "Anyone can submit contact form"
ON public.contacts
FOR INSERT
WITH CHECK (true);

-- Only authenticated users (admins) can view contacts
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON public.contacts;
CREATE POLICY "Authenticated users can view contacts"
ON public.contacts
FOR SELECT
USING (auth.role() = 'authenticated');