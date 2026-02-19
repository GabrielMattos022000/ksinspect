
-- Fix DELETE policies: change from RESTRICTIVE to PERMISSIVE for admin tables

-- LINES
DROP POLICY IF EXISTS "Admins can delete lines" ON public.lines;
CREATE POLICY "Admins can delete lines"
  ON public.lines FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- MACHINES
DROP POLICY IF EXISTS "Admins can delete machines" ON public.machines;
CREATE POLICY "Admins can delete machines"
  ON public.machines FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- PRODUCTS
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- CHARACTERISTICS
DROP POLICY IF EXISTS "Admins can delete characteristics" ON public.characteristics;
CREATE POLICY "Admins can delete characteristics"
  ON public.characteristics FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
