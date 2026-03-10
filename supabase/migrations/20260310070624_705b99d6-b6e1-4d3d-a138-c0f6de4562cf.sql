
-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create plants table
CREATE TABLE public.plants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  scientific_name TEXT,
  photo_url TEXT,
  placement TEXT DEFAULT 'İç mekan',
  water_frequency TEXT DEFAULT 'Haftada 2-3 kez',
  sunlight TEXT DEFAULT 'Orta',
  wind_sensitivity TEXT DEFAULT 'Düşük',
  temperature TEXT DEFAULT '18-25°C',
  humidity TEXT DEFAULT '%50-60',
  soil_type TEXT DEFAULT 'Humuslu toprak',
  fertilizer TEXT DEFAULT 'Ayda bir',
  notes TEXT DEFAULT '',
  current_stage INTEGER DEFAULT 0,
  days_to_harvest INTEGER DEFAULT 30,
  needs_watering BOOLEAN DEFAULT false,
  planted_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own plants" ON public.plants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own plants" ON public.plants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own plants" ON public.plants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own plants" ON public.plants FOR DELETE USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_plants_updated_at BEFORE UPDATE ON public.plants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for plant photos
INSERT INTO storage.buckets (id, name, public) VALUES ('plant-photos', 'plant-photos', true);

-- Storage policies
CREATE POLICY "Plant photos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'plant-photos');
CREATE POLICY "Users can upload plant photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'plant-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their plant photos" ON storage.objects FOR UPDATE USING (bucket_id = 'plant-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their plant photos" ON storage.objects FOR DELETE USING (bucket_id = 'plant-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
