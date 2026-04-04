import { supabase } from "@/integrations/supabase/client";

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
}

export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications" as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []) as any[];
}

export async function markAsRead(notifId: string) {
  await supabase.from("notifications" as any).update({ is_read: true } as any).eq("id", notifId);
}

export async function markAllAsRead(userId: string) {
  await supabase.from("notifications" as any).update({ is_read: true } as any).eq("user_id", userId).eq("is_read", false);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications" as any)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) return 0;
  return count || 0;
}

export async function createNotification(userId: string, type: string, title: string, body?: string, relatedId?: string) {
  await supabase.from("notifications" as any).insert({
    user_id: userId, type, title, body: body || null, related_id: relatedId || null,
  } as any);
}
