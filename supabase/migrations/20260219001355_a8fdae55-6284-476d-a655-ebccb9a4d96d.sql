
-- Add ON DELETE CASCADE to foreign key constraints so admin can delete parent records

-- measurement_cycles: cascade when line is deleted
ALTER TABLE public.measurement_cycles
  DROP CONSTRAINT measurement_cycles_line_id_fkey,
  ADD CONSTRAINT measurement_cycles_line_id_fkey
    FOREIGN KEY (line_id) REFERENCES public.lines(id) ON DELETE CASCADE;

-- measurement_cycles: cascade when machine is deleted
ALTER TABLE public.measurement_cycles
  DROP CONSTRAINT measurement_cycles_machine_id_fkey,
  ADD CONSTRAINT measurement_cycles_machine_id_fkey
    FOREIGN KEY (machine_id) REFERENCES public.machines(id) ON DELETE CASCADE;

-- measurement_cycles: cascade when product is deleted
ALTER TABLE public.measurement_cycles
  DROP CONSTRAINT measurement_cycles_product_id_fkey,
  ADD CONSTRAINT measurement_cycles_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- measurements: cascade when characteristic is deleted
ALTER TABLE public.measurements
  DROP CONSTRAINT measurements_characteristic_id_fkey,
  ADD CONSTRAINT measurements_characteristic_id_fkey
    FOREIGN KEY (characteristic_id) REFERENCES public.characteristics(id) ON DELETE CASCADE;

-- measurements: cascade when cycle is deleted
ALTER TABLE public.measurements
  DROP CONSTRAINT measurements_cycle_id_fkey,
  ADD CONSTRAINT measurements_cycle_id_fkey
    FOREIGN KEY (cycle_id) REFERENCES public.measurement_cycles(id) ON DELETE CASCADE;

-- characteristics: cascade when product is deleted
ALTER TABLE public.characteristics
  DROP CONSTRAINT characteristics_product_id_fkey,
  ADD CONSTRAINT characteristics_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- machines: cascade when line is deleted
ALTER TABLE public.machines
  DROP CONSTRAINT machines_line_id_fkey,
  ADD CONSTRAINT machines_line_id_fkey
    FOREIGN KEY (line_id) REFERENCES public.lines(id) ON DELETE CASCADE;
