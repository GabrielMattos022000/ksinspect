
-- 1. Enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'operador');

-- 2. Tabela de roles de usuário
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Função helper has_role (SECURITY DEFINER para evitar recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Linhas (ZAP)
CREATE TABLE public.lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lines ENABLE ROW LEVEL SECURITY;

-- 6. Máquinas
CREATE TABLE public.machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_id UUID REFERENCES public.lines(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;

-- 7. Produtos
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pb TEXT NOT NULL,
  ks TEXT NOT NULL,
  cav TEXT NOT NULL,
  maq TEXT NOT NULL,
  formatted_name TEXT GENERATED ALWAYS AS (
    'PB: ' || pb || ' KS: ' || ks || ' Cav: ' || cav || ' Máq: ' || maq
  ) STORED,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 8. Características
CREATE TABLE public.characteristics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'mm',
  nominal DOUBLE PRECISION NOT NULL DEFAULT 0,
  limit_min DOUBLE PRECISION NOT NULL DEFAULT 0,
  limit_max DOUBLE PRECISION NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  drawing_image_path TEXT,
  device_image_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.characteristics ENABLE ROW LEVEL SECURITY;

-- 9. Ciclos de medição
CREATE TABLE public.measurement_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_id UUID REFERENCES public.lines(id) NOT NULL,
  machine_id UUID REFERENCES public.machines(id) NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  week_cast TEXT NOT NULL,
  operator_badge TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'FINISHED')),
  overall_result TEXT CHECK (overall_result IN ('OK', 'NOK')),
  txt_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.measurement_cycles ENABLE ROW LEVEL SECURITY;

-- 10. Medições individuais
CREATE TABLE public.measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID REFERENCES public.measurement_cycles(id) ON DELETE CASCADE NOT NULL,
  characteristic_id UUID REFERENCES public.characteristics(id) NOT NULL,
  measured_value DOUBLE PRECISION,
  deviation DOUBLE PRECISION,
  within_limits BOOLEAN,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

-- 11. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_lines_updated_at BEFORE UPDATE ON public.lines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON public.machines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_characteristics_updated_at BEFORE UPDATE ON public.characteristics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. RLS Policies

-- user_roles: authenticated can read their own, admin can read all
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- profiles
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- lines: all authenticated can read, admin can write
CREATE POLICY "Authenticated can read lines" ON public.lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert lines" ON public.lines FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update lines" ON public.lines FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete lines" ON public.lines FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- machines
CREATE POLICY "Authenticated can read machines" ON public.machines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert machines" ON public.machines FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update machines" ON public.machines FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete machines" ON public.machines FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- products
CREATE POLICY "Authenticated can read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- characteristics
CREATE POLICY "Authenticated can read characteristics" ON public.characteristics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert characteristics" ON public.characteristics FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update characteristics" ON public.characteristics FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete characteristics" ON public.characteristics FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- measurement_cycles: user can read/write own, admin can read all
CREATE POLICY "Users can read own cycles" ON public.measurement_cycles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can read all cycles" ON public.measurement_cycles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own cycles" ON public.measurement_cycles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own cycles" ON public.measurement_cycles FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- measurements: linked to cycle ownership
CREATE POLICY "Users can read own measurements" ON public.measurements FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.measurement_cycles WHERE id = cycle_id AND user_id = auth.uid()));
CREATE POLICY "Admins can read all measurements" ON public.measurements FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own measurements" ON public.measurements FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.measurement_cycles WHERE id = cycle_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own measurements" ON public.measurements FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.measurement_cycles WHERE id = cycle_id AND user_id = auth.uid()));

-- 13. Storage bucket for characteristic images
INSERT INTO storage.buckets (id, name, public) VALUES ('characteristic-images', 'characteristic-images', true);

CREATE POLICY "Anyone can view characteristic images" ON storage.objects FOR SELECT USING (bucket_id = 'characteristic-images');
CREATE POLICY "Admins can upload characteristic images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'characteristic-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update characteristic images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'characteristic-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete characteristic images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'characteristic-images' AND public.has_role(auth.uid(), 'admin'));
