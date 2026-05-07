-- Move misplaced direction text out of placement field for affected plants
UPDATE public.plants SET placement = NULL, direction = 'Kuzey'
  WHERE id = '577b897b-ab0f-4f6c-86b9-7ecbefdba1fe';
UPDATE public.plants SET placement = NULL, direction = 'Güneybatı'
  WHERE id = '459c42ae-3df0-44d1-bc1f-97d4f6d4ac02';
UPDATE public.plants SET placement = NULL
  WHERE id = '93583c37-f36d-4a54-b3d9-f0b8319019b4';