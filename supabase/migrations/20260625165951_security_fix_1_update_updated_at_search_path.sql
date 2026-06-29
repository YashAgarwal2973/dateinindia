
-- Fix 1: Lock down search_path on update_updated_at trigger function.
-- Keeping SECURITY INVOKER (NOT changing to DEFINER — this trigger only sets
-- a timestamp and does not need elevated privileges).
-- Using CREATE OR REPLACE avoids CASCADE-dropping the trigger on users.

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_updated_at() TO authenticated, anon;
