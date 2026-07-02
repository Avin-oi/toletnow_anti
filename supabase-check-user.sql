-- ============================================================
-- Supabase RPC Function: Check if user exists by email
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/saoqryectqrnuhoskvwc
-- ============================================================

CREATE OR REPLACE FUNCTION check_user_exists(lookup_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE email = lookup_email
  );
END;
$$;
