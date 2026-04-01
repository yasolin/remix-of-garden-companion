import { supabase } from "@/integrations/supabase/client";

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  plant_name: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile?: { display_name: string | null; avatar_url: string | null };
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { display_name: string | null; avatar_url: string | null };
}

export async function fetchPosts(): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from("community_posts" as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;

  const posts = (data || []) as any[];
  // Fetch profiles for all unique user_ids
  const userIds = [...new Set(posts.map(p => p.user_id))];
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles" as any)
      .select("user_id, display_name, avatar_url")
      .in("user_id", userIds);
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
    return posts.map(p => ({ ...p, profile: profileMap.get(p.user_id) || null }));
  }
  return posts;
}

export async function createPost(userId: string, content: string, imageUrl?: string, plantName?: string) {
  const { data, error } = await supabase
    .from("community_posts" as any)
    .insert({ user_id: userId, content, image_url: imageUrl || null, plant_name: plantName || null } as any)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePost(postId: string) {
  const { error } = await supabase.from("community_posts" as any).delete().eq("id", postId);
  if (error) throw error;
}

export async function toggleLike(postId: string, userId: string): Promise<boolean> {
  // Check if already liked
  const { data: existing } = await supabase
    .from("community_likes" as any)
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("community_likes" as any).delete().eq("id", (existing as any).id);
    return false; // unliked
  } else {
    await supabase.from("community_likes" as any).insert({ post_id: postId, user_id: userId } as any);
    return true; // liked
  }
}

export async function fetchComments(postId: string): Promise<CommunityComment[]> {
  const { data, error } = await supabase
    .from("community_comments" as any)
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const comments = (data || []) as any[];
  const userIds = [...new Set(comments.map(c => c.user_id))];
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles" as any)
      .select("user_id, display_name, avatar_url")
      .in("user_id", userIds);
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
    return comments.map(c => ({ ...c, profile: profileMap.get(c.user_id) || null }));
  }
  return comments;
}

export async function addComment(postId: string, userId: string, content: string) {
  const { data, error } = await supabase
    .from("community_comments" as any)
    .insert({ post_id: postId, user_id: userId, content } as any)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getUserLikes(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("community_likes" as any)
    .select("post_id")
    .eq("user_id", userId);
  return new Set((data || []).map((d: any) => d.post_id));
}

export async function uploadPostImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `community/${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("plant-photos").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("plant-photos").getPublicUrl(path);
  return data.publicUrl;
}
