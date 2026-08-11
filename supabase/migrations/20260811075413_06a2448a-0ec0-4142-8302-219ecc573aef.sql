-- Private PII table
CREATE TABLE public.profiles_private (
  user_id uuid PRIMARY KEY,
  surname text,
  age integer,
  gender text,
  occupation text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles_private TO authenticated;
GRANT ALL ON public.profiles_private TO service_role;

ALTER TABLE public.profiles_private ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own private profile"
ON public.profiles_private
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_private_updated_at
BEFORE UPDATE ON public.profiles_private
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing PII
INSERT INTO public.profiles_private (user_id, surname, age, gender, occupation, phone)
SELECT user_id, surname, age, gender, occupation, phone
FROM public.profiles
WHERE surname IS NOT NULL OR age IS NOT NULL OR gender IS NOT NULL OR occupation IS NOT NULL OR phone IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE public.profiles
  DROP COLUMN surname,
  DROP COLUMN age,
  DROP COLUMN gender,
  DROP COLUMN occupation,
  DROP COLUMN phone;

-- Drop temporary definer view
DROP VIEW IF EXISTS public.public_profiles;

-- Profiles readable by signed-in users (non-sensitive fields only remain)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Signed-in users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

REVOKE SELECT ON public.profiles FROM anon;