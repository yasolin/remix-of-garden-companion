import { ArrowLeft, Heart, MessageCircle, Share2, Leaf, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { fetchUserPlants } from "@/lib/plantService";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

interface CommunityPost {
  id: string;
  userName: string;
  avatar: string;
  plantName: string;
  image?: string;
  content: string;
  likes: number;
  comments: number;
  timeAgo: string;
}

const CommunityPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const { data: plants = [] } = useQuery({
    queryKey: ["plants", user?.id],
    queryFn: () => fetchUserPlants(user!.id),
    enabled: !!user,
  });

  // Mock community posts for now
  const mockPosts: CommunityPost[] = [
    {
      id: "1", userName: "Ayşe B.", avatar: "🌻",
      plantName: t("community.tomato"), image: undefined,
      content: t("community.samplePost1"),
      likes: 24, comments: 5, timeAgo: t("community.hoursAgo", { count: 3 }),
    },
    {
      id: "2", userName: "Mehmet K.", avatar: "🌿",
      plantName: t("community.basil"), image: undefined,
      content: t("community.samplePost2"),
      likes: 18, comments: 3, timeAgo: t("community.hoursAgo", { count: 7 }),
    },
    {
      id: "3", userName: "Elif D.", avatar: "🌺",
      plantName: t("community.pepper"), image: undefined,
      content: t("community.samplePost3"),
      likes: 32, comments: 8, timeAgo: t("community.daysAgo", { count: 1 }),
    },
  ];

  const toggleLike = (postId: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{t("community.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("community.subtitle")}</p>
        </div>
        <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Plus className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>

      {/* User's shareable plants */}
      {plants.length > 0 && (
        <div className="px-4 mt-3">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {plants.slice(0, 5).map(plant => (
              <div key={plant.id} className="shrink-0 flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-full border-2 border-primary/30 overflow-hidden">
                  {plant.photo_url ? (
                    <img src={plant.photo_url} alt={plant.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-primary/40" />
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground font-medium truncate w-14 text-center">{plant.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="px-4 mt-3 space-y-3">
        {mockPosts.map((post, i) => (
          <motion.div key={post.id}
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
                  {post.avatar}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{post.userName}</p>
                  <p className="text-[10px] text-muted-foreground">{post.timeAgo} • {post.plantName}</p>
                </div>
              </div>
              <p className="text-sm text-foreground mb-3">{post.content}</p>
              <div className="flex items-center gap-4">
                <button onClick={() => toggleLike(post.id)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors">
                  <Heart className={`w-4 h-4 ${likedPosts.has(post.id) ? "fill-destructive text-destructive" : ""}`} />
                  <span className="text-xs">{post.likes + (likedPosts.has(post.id) ? 1 : 0)}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs">{post.comments}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground ml-auto">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="px-4 mt-4">
        <p className="text-center text-xs text-muted-foreground">{t("community.comingSoon")}</p>
      </div>
    </div>
  );
};

export default CommunityPage;
