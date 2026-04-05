
-- Add personal info columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS surname text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS occupation text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- Add toxic_to_pets to plants
ALTER TABLE public.plants ADD COLUMN IF NOT EXISTS toxic_to_pets boolean DEFAULT false;
