import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LockKeyhole, Sprout, Crown, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function SeedExchange() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const tr = i18n.language.startsWith("tr");
  const qc = useQueryClient();
  const [form, setForm] = useState({ seed_name: "", quantity: "", location: "", content: "" });
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<Record<string, string>>({});
  const { data: premium = false, isLoading: checking } = useQuery({ queryKey: ["premium", user?.id], enabled: !!user, queryFn: async () => {
    if (!user) return false;
    const { data, error } = await supabase.from("premium_memberships").select("expires_at").eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    return !!data && new Date(data.expires_at).getTime() > Date.now();
  } });
  const { data: feed, isLoading, error } = useQuery({ queryKey: ["seed-exchange", user?.id], enabled: premium, queryFn: async () => {
    const { data: posts, error } = await supabase.from("seed_posts").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    const { data: replies, error: replyError } = await supabase.from("seed_replies").select("*").order("created_at");
    if (replyError) throw replyError;
    const ids = [...new Set([...(posts ?? []).map(p => p.user_id), ...(replies ?? []).map(r => r.user_id)])];
    const { data: profiles } = ids.length ? await supabase.from("profiles").select("user_id,display_name").in("user_id", ids) : { data: [] };
    return { posts: posts ?? [], replies: replies ?? [], names: Object.fromEntries((profiles ?? []).map(p => [p.user_id, p.display_name])) };
  } });
  const run = async (action: () => Promise<void>) => { setBusy(true); try { await action(); await qc.invalidateQueries({ queryKey: ["seed-exchange"] }); } catch (e) { toast({ title: tr ? "Paylaşım yapılamadı" : "Could not share", description: e instanceof Error ? e.message : String(e), variant: "destructive" }); } finally { setBusy(false); } };
  if (checking) return <p className="p-4 text-muted-foreground">{tr ? "Üyelik kontrol ediliyor…" : "Checking membership…"}</p>;
  if (!premium) return <div className="px-4 py-8 text-center space-y-3"><LockKeyhole className="w-10 h-10 text-primary mx-auto" /><h2 className="text-xl font-bold text-foreground">{tr ? "Ata tohumu paylaşımı" : "Heirloom seed exchange"}</h2><p className="text-sm text-muted-foreground">{tr ? "Tohum paylaşımlarını görmek ve tohumlarını paylaşmak için aktif Premium üyeliği gerekir." : "An active Premium membership is required to view and share seeds."}</p><span className="inline-flex gap-2 items-center text-primary font-semibold"><Crown className="w-4 h-4" />Garden Pot Premium</span></div>;
  return <div className="px-4 space-y-5">
    <h2 className="font-bold text-foreground flex items-center gap-2"><Sprout className="text-primary" />{tr ? "Ata tohumu paylaşımı" : "Heirloom seed exchange"}</h2>
    <form className="space-y-2" onSubmit={e => { e.preventDefault(); if (!user) return; void run(async () => { const { error } = await supabase.from("seed_posts").insert({ ...form, user_id: user.id }); if (error) throw error; setForm({ seed_name: "", quantity: "", location: "", content: "" }); }); }}>
      {(["seed_name", "quantity", "location"] as const).map((k, i) => <input key={k} required={k === "seed_name"} maxLength={150} aria-label={(tr ? ["Tohum adı", "Miktar", "Şehir / konum"] : ["Seed name", "Quantity", "City / location"])[i]} placeholder={(tr ? ["Tohum adı", "Miktar", "Şehir / konum"] : ["Seed name", "Quantity", "City / location"])[i]} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} className="w-full bg-secondary text-foreground border border-border rounded-lg px-3 py-2.5 text-sm" />)}
      <textarea required maxLength={4000} placeholder={tr ? "Elindeki tohumları ve paylaşım koşullarını yaz" : "Describe your seeds and sharing arrangements"} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="w-full bg-secondary text-foreground border border-border rounded-lg p-3 text-sm" />
      <Button type="submit" disabled={busy}><Send />{tr ? "Tohumlarını paylaş" : "Share your seeds"}</Button>
    </form>
    {error && <p role="alert" className="text-destructive">{tr ? "Paylaşımlar yüklenemedi." : "Could not load posts."}</p>}
    {isLoading ? <p className="text-muted-foreground">{tr ? "Yükleniyor…" : "Loading…"}</p> : !feed?.posts.length ? <p className="text-muted-foreground text-sm">{tr ? "Henüz tohum paylaşımı yok." : "No seeds shared yet."}</p> : feed.posts.map(p => <article key={p.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex justify-between"><div><h3 className="font-bold text-foreground">{p.seed_name}</h3><p className="text-xs text-muted-foreground">{feed.names[p.user_id] || (tr ? "Üye" : "Member")} · {p.quantity} · {p.location}</p></div>{p.user_id === user?.id && <Button variant="ghost" size="icon" aria-label={tr ? "Paylaşımı sil" : "Delete post"} onClick={() => void run(async () => { const { error } = await supabase.from("seed_posts").delete().eq("id", p.id); if (error) throw error; })}><Trash2 /></Button>}</div>
      <p className="text-sm text-foreground whitespace-pre-wrap break-words">{p.content}</p>
      {feed.replies.filter(r => r.post_id === p.id).map(r => <div key={r.id} className="border-l-2 border-primary/30 pl-3"><p className="text-xs font-semibold text-foreground">{feed.names[r.user_id] || (tr ? "Üye" : "Member")}</p><p className="text-sm text-muted-foreground break-words">{r.content}</p></div>)}
      <form className="flex gap-2" onSubmit={e => { e.preventDefault(); if (!user || !reply[p.id]?.trim()) return; void run(async () => { const { error } = await supabase.from("seed_replies").insert({ post_id: p.id, user_id: user.id, content: reply[p.id].trim() }); if (error) throw error; setReply({ ...reply, [p.id]: "" }); }); }}><input required maxLength={2000} aria-label={tr ? "Yanıt yaz" : "Write a reply"} placeholder={tr ? "Yanıt yaz" : "Write a reply"} value={reply[p.id] ?? ""} onChange={e => setReply({ ...reply, [p.id]: e.target.value })} className="min-w-0 flex-1 bg-secondary text-foreground rounded-lg px-3 text-sm" /><Button size="icon" disabled={busy} aria-label={tr ? "Yanıtı gönder" : "Send reply"}><Send /></Button></form>
    </article>)}
  </div>;
}