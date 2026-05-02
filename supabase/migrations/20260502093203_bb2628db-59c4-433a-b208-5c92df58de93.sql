
-- Plants tablosuna yeni alanlar
ALTER TABLE public.plants
  ADD COLUMN IF NOT EXISTS pot_size TEXT,
  ADD COLUMN IF NOT EXISTS pot_type TEXT,
  ADD COLUMN IF NOT EXISTS watering_amount_ml INTEGER,
  ADD COLUMN IF NOT EXISTS watering_interval_days INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS last_watered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_watering_at TIMESTAMPTZ;

-- Watering events tablosu
CREATE TABLE IF NOT EXISTS public.watering_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  amount_ml INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_watering_events_user ON public.watering_events(user_id);
CREATE INDEX IF NOT EXISTS idx_watering_events_plant ON public.watering_events(plant_id);
CREATE INDEX IF NOT EXISTS idx_watering_events_scheduled ON public.watering_events(scheduled_at);

ALTER TABLE public.watering_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watering events"
  ON public.watering_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own watering events"
  ON public.watering_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watering events"
  ON public.watering_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watering events"
  ON public.watering_events FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_watering_events_updated_at
  BEFORE UPDATE ON public.watering_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Profiles tablosuna hesap durumu
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;

-- Storage bucket'ları
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-photos', 'community-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Plant photos politikaları (eski varsa düşür, yeniden kur)
DROP POLICY IF EXISTS "Plant photos are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own plant photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own plant photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own plant photos" ON storage.objects;

CREATE POLICY "Plant photos are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'plant-photos');

CREATE POLICY "Users can upload their own plant photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'plant-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own plant photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'plant-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own plant photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'plant-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Community photos politikaları
DROP POLICY IF EXISTS "Community photos are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload community photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own community photos" ON storage.objects;

CREATE POLICY "Community photos are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'community-photos');

CREATE POLICY "Users can upload community photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'community-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own community photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'community-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Avatar politikaları
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Avatars are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
