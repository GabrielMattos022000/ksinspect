
-- Allow operators to read all measurement cycles
CREATE POLICY "Operators can read all cycles"
ON public.measurement_cycles
FOR SELECT
USING (has_role(auth.uid(), 'operador'::app_role));

-- Allow operators to read all measurements
CREATE POLICY "Operators can read all measurements"
ON public.measurements
FOR SELECT
USING (has_role(auth.uid(), 'operador'::app_role));
