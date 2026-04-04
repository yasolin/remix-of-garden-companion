import { ArrowLeft, Heart, MessageCircle, Share2, Plus, Send, Image, X, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchPosts, createPost, toggleLike, fetchComments, addComment,
  getUserLikes, uploadPostImage, deletePost,
  type CommunityPost, type CommunityComment,
} from "@/lib/communityService";
import { createNotification } from "@/lib/notificationService";

const categories = [
  { key: "all", emoji: "🌍" },
  { key: "vegetables", emoji: "🥬" },
  { key: "fruits", emoji: "🍎" },
  { key: "herbs", emoji: "🌿" },
  { key: "flowers", emoji: "🌸" },
  { key: "tips", emoji: "💡" },
];

const CommunityPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showNewPost, setShowNewPost] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("general");
  const [posting, setPosting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const imageRef = useRef<HTMLInputElement>(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["community-posts"],
    queryFn: fetchPosts,
    enabled: !!user,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["community-comments", expandedComments],
    queryFn: () => fetchComments(expandedComments!),
    enabled: !!expandedComments,
  });

  useEffect(() => {
    if (user) getUserLikes(user.id).then(setLikedPosts);
  }, [user]);

  useEffect(() => {
    const channel = supabase
      .channel("community-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_posts" }, () => {
        queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "community_comments" }, () => {
        if (expandedComments) queryClient.invalidateQueries({ queryKey: ["community-comments", expandedComments] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient, expandedComments]);

  const handleImageSelect = (file: File) => {
    setNewImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setNewImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!user || !newContent.trim()) return;
    setPosting(true);
    try {
      let imageUrl: string | undefined;
      if (newImage) imageUrl = await uploadPostImage(user.id, newImage);
      await createPost(user.id, newContent.trim(), imageUrl);
      setNewContent(""); setNewImage(null); setNewImagePreview(null); setShowNewPost(false);
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      toast({ title: "✅", description: t("community.posted") });
    } catch (e: any) {
      toast({ title: "❌", description: e.message, variant: "destructive" });
    }
    setPosting(false);
  };

  const handleLike = async (post: CommunityPost) => {
    if (!user) return;
    const liked = await toggleLike(post.id, user.id);
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (liked) next.add(post.id); else next.delete(post.id);
      return next;
    });
    queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    // Send notification to post owner
    if (liked && post.user_id !== user.id) {
      const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "";
      createNotification(post.user_id, "community_like", `❤️ ${displayName}`, t("community.likedYourPost"), post.id);
    }
  };

  const handleComment = async (post: CommunityPost) => {
    if (!user || !commentText.trim()) return;
    await addComment(post.id, user.id, commentText.trim());
    // Send notification
    if (post.user_id !== user.id) {
      const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "";
      createNotification(post.user_id, "community_comment", `💬 ${displayName}`, commentText.trim().slice(0, 100), post.id);
    }
    setCommentText("");
    queryClient.invalidateQueries({ queryKey: ["community-comments", post.id] });
    queryClient.invalidateQueries({ queryKey: ["community-posts"] });
  };

  const handleDelete = async (postId: string) => {
    if (!confirm(t("community.confirmDelete"))) return;
    await deletePost(postId);
    queryClient.invalidateQueries({ queryKey: ["community-posts"] });
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("community.hoursAgo", { count: hours });
    return t("community.daysAgo", { count: Math.floor(hours / 24) });
  };

  const filteredPosts = filterCategory === "all" ? posts : posts.filter((p: any) => p.category === filterCategory);

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <input ref={imageRef} type="file" accept="image/*" className="hidden"
        onChange={e => e.target.files?.[0] && handleImageSelect(e.target.files[0])} />

      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{t("community.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("community.subtitle")}</p>
        </div>
        <button onClick={() => setShowNewPost(!showNewPost)}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Plus className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>

      {/* Category filters */}
      <div className="px-4 flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button key={cat.key} onClick={() => setFilterCategory(cat.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filterCategory === cat.key ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
            }`}>
            <span>{cat.emoji}</span>
            {t(`community.cat_${cat.key}`)}
          </button>
        ))}
      </div>

      {/* New post form */}
      <AnimatePresence>
        {showNewPost && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="px-4 mb-3 overflow-hidden">
            <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
              <textarea value={newContent} onChange={e => setNewContent(e.target.value)}
                placeholder={t("community.writeSomething")}
                className="w-full bg-secondary rounded-xl p-3 text-sm text-foreground outline-none resize-none min-h-[80px] placeholder:text-muted-foreground" />
              {newImagePreview && (
                <div className="relative">
                  <img src={newImagePreview} alt="" className="w-full h-40 object-cover rounded-xl" />
                  <button onClick={() => { setNewImage(null); setNewImagePreview(null); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button onClick={() => imageRef.current?.click()}
                  className="p-2 rounded-lg bg-secondary hover:bg-muted">
                  <Image className="w-4 h-4 text-muted-foreground" />
                </button>
                <div className="flex-1" />
                <button onClick={handlePost} disabled={posting || !newContent.trim()}
                  className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-50">
                  {posting ? "..." : t("community.post")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Posts */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">{t("community.noPosts")}</p>
          </div>
        ) : (
          filteredPosts.map((post: CommunityPost, i: number) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center">
                    {post.profile?.avatar_url ? (
                      <img src={post.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">🌱</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {post.profile?.display_name || t("community.anonymous")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {timeAgo(post.created_at)}
                      {post.plant_name && ` • ${post.plant_name}`}
                    </p>
                  </div>
                  {user?.id === post.user_id && (
                    <button onClick={() => handleDelete(post.id)} className="p-1.5 rounded-lg hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4 text-destructive/50" />
                    </button>
                  )}
                </div>

                <p className="text-sm text-foreground mb-3">{post.content}</p>

                {post.image_url && (
                  <img src={post.image_url} alt="" className="w-full h-48 object-cover rounded-xl mb-3" />
                )}

                <div className="flex items-center gap-4">
                  <button onClick={() => handleLike(post)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors">
                    <Heart className={`w-4 h-4 ${likedPosts.has(post.id) ? "fill-destructive text-destructive" : ""}`} />
                    <span className="text-xs">{post.likes_count}</span>
                  </button>
                  <button onClick={() => setExpandedComments(expandedComments === post.id ? null : post.id)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs">{post.comments_count}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground ml-auto">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                <AnimatePresence>
                  {expandedComments === post.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-border space-y-2">
                      {comments.map((c: CommunityComment) => (
                        <div key={c.id} className="flex gap-2">
                          <div className="w-7 h-7 rounded-full bg-secondary shrink-0 flex items-center justify-center text-xs overflow-hidden">
                            {c.profile?.avatar_url ? (
                              <img src={c.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : "🌿"}
                          </div>
                          <div className="flex-1 bg-secondary rounded-xl px-3 py-2">
                            <p className="text-[11px] font-semibold text-foreground">{c.profile?.display_name || t("community.anonymous")}</p>
                            <p className="text-xs text-foreground">{c.content}</p>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-2 mt-2">
                        <input value={commentText} onChange={e => setCommentText(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleComment(post)}
                          placeholder={t("community.writeComment")}
                          className="flex-1 bg-secondary rounded-full px-3 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground" />
                        <button onClick={() => handleComment(post)}
                          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Send className="w-3.5 h-3.5 text-primary-foreground" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
