import { ArrowLeft, Send, Scan, Leaf, MapPin, Image } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { streamPlantAI, type AiMessage } from "@/lib/plantAI";
import { toast } from "@/hooks/use-toast";

const AIAssistantPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<AiMessage[]>([
    { role: "assistant", content: t("ai.welcome") },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [pendingMode, setPendingMode] = useState<string>("chat");

  const displayFeatures = [
    { icon: Leaf, title: t("ai.plantRecognition"), desc: t("ai.plantRecognitionDesc"), color: "bg-primary/10 text-primary", mode: "identify" },
    { icon: Scan, title: t("ai.diseaseDetection"), desc: t("ai.diseaseDesc"), color: "bg-destructive/10 text-destructive", mode: "disease" },
    { icon: MapPin, title: t("ai.locationAnalysis"), desc: t("ai.locationAnalysisDesc"), color: "bg-accent/10 text-accent", mode: "location" },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFeatureClick = (mode: string) => {
    if (mode === "location") {
      navigate("/location-analysis");
      return;
    }
    setPendingMode(mode);
    cameraRef.current?.click();
  };

  const handleGalleryClick = () => {
    setPendingMode("chat");
    galleryRef.current?.click();
  };

  const handlePhotoTaken = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const userMsg: AiMessage = { role: "user", content: t("ai.photoAnalysis") };
      setMessages(prev => [...prev, userMsg]);
      setIsLoading(true);

      let assistantSoFar = "";
      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.content === t("ai.photoAnalysis")) {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      try {
        await streamPlantAI({
          messages: [{ role: "user", content: "Analyze this plant image." }],
          mode: pendingMode,
          imageBase64: base64,
          lang: i18n.language,
          onDelta: upsertAssistant,
          onDone: () => setIsLoading(false),
        });
      } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    const userMsg: AiMessage = { role: "user", content: message };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setMessage("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamPlantAI({
        messages: allMessages.filter(m => m.role !== "assistant" || allMessages.indexOf(m) !== 0),
        mode: "chat",
        lang: i18n.language,
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto flex flex-col" style={{ height: "calc(100vh - 70px)" }}>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => e.target.files?.[0] && handlePhotoTaken(e.target.files[0])} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => e.target.files?.[0] && handlePhotoTaken(e.target.files[0])} />

      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t("ai.title")}</h1>
      </div>

      <div className="px-4 flex gap-3 overflow-x-auto pb-3 shrink-0">
        {displayFeatures.map((f, i) => (
          <motion.button key={f.mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }} onClick={() => handleFeatureClick(f.mode)}
            className="min-w-[110px] bg-card rounded-xl p-3 shadow-card border border-border flex flex-col items-center gap-2 text-center">
            <div className={`w-9 h-9 rounded-lg ${f.color} flex items-center justify-center`}>
              <f.icon className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-foreground">{f.title}</span>
          </motion.button>
        ))}
      </div>

      {/* Messages - flex-1 to fill available space */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3">
        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            className={`max-w-[85%] p-3 rounded-2xl text-sm ${
              msg.role === "user"
                ? "ml-auto bg-primary text-primary-foreground rounded-br-md"
                : "bg-secondary text-secondary-foreground rounded-bl-md"
            }`}>
            {msg.role === "assistant" ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            ) : msg.content}
          </motion.div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="max-w-[85%] p-3 rounded-2xl bg-secondary rounded-bl-md">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0.1s" }} />
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - fixed at bottom, just above nav */}
      <div className="px-4 py-2 flex items-center gap-2 shrink-0 bg-background border-t border-border">
        <button onClick={handleGalleryClick} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
          <Image className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="flex-1 flex items-center bg-secondary rounded-full px-3 py-2">
          <input value={message} onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={t("ai.placeholder")}
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground" />
        </div>
        <button onClick={sendMessage} disabled={isLoading}
          className="w-9 h-9 rounded-full bg-primary flex items-center justify-center disabled:opacity-50 shrink-0">
          <Send className="w-4 h-4 text-primary-foreground" />
        </button>
      </div>
    </div>
  );
};

export default AIAssistantPage;
