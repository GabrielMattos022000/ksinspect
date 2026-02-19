
-- Add group column to machines table
ALTER TABLE public.machines
  ADD COLUMN IF NOT EXISTS machine_group text NOT NULL DEFAULT 'Cilmop';
