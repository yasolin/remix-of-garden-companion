import { ArrowLeft, Bell, Check, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchNotifications, markAsRead, markAllAsRead, type AppNotification } from "@/lib/notificationService";

const typeIcons: Record<string, string> = {
  watering: "💧",
  harvest: "🌿",
  planting: "🌱",
  community_like: "❤️",
  community_comment: "💬",
  info: "📢",
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => fetchNotifications(user!.id),
    enabled: !!user,
    refetchInterval: 15000,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleRead = async (notif: AppNotification) => {
    if (notif.is_read) return;
    await markAsRead(notif.id);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllAsRead(user.id);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{t("notifications.title")}</h1>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground">{t("notifications.unreadCount", { count: unreadCount })}</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
            <CheckCheck className="w-3.5 h-3.5" />
            {t("notifications.markAllRead")}
          </button>
        )}
      </div>

      <div className="px-4 mt-3 space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t("notifications.noNotifications")}</p>
          </div>
        ) : (
          notifications.map((notif, i) => (
            <motion.div key={notif.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => handleRead(notif)}
              className={`rounded-xl p-3.5 border cursor-pointer transition-colors ${
                notif.is_read
                  ? "bg-card border-border"
                  : "bg-primary/5 border-primary/20"
              }`}>
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{typeIcons[notif.type] || "📢"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${notif.is_read ? "text-foreground" : "text-foreground font-semibold"}`}>
                      {notif.title}
                    </p>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  {notif.body && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(notif.created_at)}</p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
