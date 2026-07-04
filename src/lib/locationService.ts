import { supabase } from "@/integrations/supabase/client";

export interface LocationRow {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  direction: string | null;
  sun_exposure: string | null;
  humidity: string | null;
  notes: string | null;
  ai_analyzed: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchUserLocations(userId: string): Promise<LocationRow[]> {
  const { data, error } = await supabase
    .from("locations" as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as any[];
}

export async function createLocation(input: Partial<LocationRow> & { user_id: string; name: string }): Promise<LocationRow> {
  const { data, error } = await supabase
    .from("locations" as any)
    .insert(input as any)
    .select()
    .single();
  if (error) throw error;
  return data as any;
}

export async function updateLocation(id: string, updates: Partial<LocationRow>): Promise<void> {
  const { error } = await supabase.from("locations" as any).update(updates as any).eq("id", id);
  if (error) throw error;
}

export async function deleteLocation(id: string): Promise<void> {
  const { error } = await supabase.from("locations" as any).delete().eq("id", id);
  if (error) throw error;
}
