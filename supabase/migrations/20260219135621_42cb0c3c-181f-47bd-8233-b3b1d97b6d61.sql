
-- 1. Add measurement_interval_minutes to characteristics
ALTER TABLE public.characteristics
  ADD COLUMN IF NOT EXISTS measurement_interval_minutes integer NOT NULL DEFAULT 60;

-- 2. Lines now contain machine information inline (no separate machines table needed for new flow)
-- Add machine_count to lines to track how many machines the line has
ALTER TABLE public.lines
  ADD COLUMN IF NOT EXISTS machine_count integer NOT NULL DEFAULT 1;

-- 3. Add machine_group to lines (the group of the line)
ALTER TABLE public.lines
  ADD COLUMN IF NOT EXISTS line_group text NOT NULL DEFAULT 'Cilmop';

-- 4. Add cav and maq columns to measurement_cycles (to capture at cycle start)
ALTER TABLE public.measurement_cycles
  ADD COLUMN IF NOT EXISTS cav text NOT NULL DEFAULT '';

ALTER TABLE public.measurement_cycles
  ADD COLUMN IF NOT EXISTS maq text NOT NULL DEFAULT '';
