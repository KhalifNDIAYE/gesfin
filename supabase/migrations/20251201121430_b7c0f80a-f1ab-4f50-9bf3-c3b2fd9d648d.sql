
-- Create enum for module names
CREATE TYPE public.module_name AS ENUM (
  'dashboard', 'projets', 'comptabilite', 'bailleurs', 'conventions', 
  'immobilisations', 'marches', 'decaissements', 'rapports', 
  'utilisateurs', 'securite', 'parametres'
);

-- Create enum for permission types
CREATE TYPE public.permission_type AS ENUM ('read', 'create', 'update', 'delete');

-- Create roles table
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  department TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_roles junction table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES public.profiles(id),
  UNIQUE(user_id, role_id)
);

-- Create permissions table
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module module_name NOT NULL,
  permission permission_type NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(module, permission)
);

-- Create role_permissions junction table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID REFERENCES public.profiles(id),
  UNIQUE(role_id, permission_id)
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  user_email TEXT,
  action TEXT NOT NULL,
  module module_name,
  resource_type TEXT,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
      AND r.name = _role_name
  )
$$;

-- Security definer function to check if user has admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Security definer function to check if user has permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _module module_name, _permission permission_type)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id
      AND p.module = _module
      AND p.permission = _permission
  ) OR public.is_admin(_user_id)
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()) OR auth.uid() = id);

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for roles
CREATE POLICY "Authenticated users can view roles"
  ON public.roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON public.roles FOR ALL
  USING (public.is_admin(auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage user roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin(auth.uid()));

-- RLS Policies for permissions
CREATE POLICY "Authenticated users can view permissions"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage permissions"
  ON public.permissions FOR ALL
  USING (public.is_admin(auth.uid()));

-- RLS Policies for role_permissions
CREATE POLICY "Authenticated users can view role permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage role permissions"
  ON public.role_permissions FOR ALL
  USING (public.is_admin(auth.uid()));

-- RLS Policies for audit_logs
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action TEXT,
  _module module_name DEFAULT NULL,
  _resource_type TEXT DEFAULT NULL,
  _resource_id TEXT DEFAULT NULL,
  _old_values JSONB DEFAULT NULL,
  _new_values JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
  _user_email TEXT;
BEGIN
  SELECT email INTO _user_email FROM public.profiles WHERE id = auth.uid();
  
  INSERT INTO public.audit_logs (user_id, user_email, action, module, resource_type, resource_id, old_values, new_values)
  VALUES (auth.uid(), _user_email, _action, _module, _resource_type, _resource_id, _old_values, _new_values)
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- Function to increment failed login attempts
CREATE OR REPLACE FUNCTION public.increment_failed_login(_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _attempts INTEGER;
BEGIN
  UPDATE public.profiles
  SET failed_login_attempts = failed_login_attempts + 1,
      locked_until = CASE 
        WHEN failed_login_attempts >= 4 THEN now() + INTERVAL '30 minutes'
        ELSE locked_until
      END
  WHERE email = _email
  RETURNING failed_login_attempts INTO _attempts;
END;
$$;

-- Function to reset failed login attempts
CREATE OR REPLACE FUNCTION public.reset_failed_login(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET failed_login_attempts = 0,
      locked_until = NULL,
      last_login_at = now()
  WHERE id = _user_id;
END;
$$;

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION public.is_account_locked(_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE email = _email
      AND locked_until IS NOT NULL
      AND locked_until > now()
  )
$$;

-- Insert default roles
INSERT INTO public.roles (name, description, is_system) VALUES
  ('admin', 'Administrateur système avec tous les droits', true),
  ('comptable', 'Responsable de la comptabilité', true),
  ('gestionnaire', 'Gestionnaire de projets', true),
  ('auditeur', 'Auditeur avec accès en lecture', true),
  ('lecture', 'Accès en lecture seule', true);

-- Insert all permissions for all modules
INSERT INTO public.permissions (module, permission, description)
SELECT 
  m.module,
  p.permission,
  'Permission ' || p.permission::TEXT || ' pour le module ' || m.module::TEXT
FROM (
  SELECT unnest(enum_range(NULL::module_name)) AS module
) m
CROSS JOIN (
  SELECT unnest(enum_range(NULL::permission_type)) AS permission
) p;

-- Grant all permissions to admin role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin';
