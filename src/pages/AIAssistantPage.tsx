import { ArrowLeft, Camera, Send, Mic, Scan, Leaf, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { streamPlantAI, type AiMessage } from "@/lib/plantAI";
import { toast } from "@/hooks/use-toast";

const AIAssistantPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<AiMessage[]>([
    { role: "assistant", content: t("ai.welcome") },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [pendingMode, setPendingMode] = useState<string>("chat");

  const features = [
    { icon: Camera, title: t("ai.diseaseDetection").split(" ")[0], desc: t("ai.diseaseDesc"), color: "bg-destructive/10 text-destructive", mode: "disease" },
    { icon: Scan, title: t("ai.diseaseDetection"), desc: t("ai.diseaseDesc"), color: "bg-destructive/10 text-destructive", mode: "disease" },
    { icon: Leaf, title: t("ai.plantRecognition"), desc: t("ai.plantRecognitionDesc"), color: "bg-primary/10 text-primary", mode: "identify" },
    { icon: MapPin, title: t("ai.locationAnalysis"), desc: t("ai.locationAnalysisDesc"), color: "bg-accent/10 text-accent", mode: "location" },
  ];

  // Remove duplicate - show Camera, Disease Detection, Plant Recognition, Location Analysis
  const displayFeatures = [
    { icon: Scan, title: t("ai.diseaseDetection"), desc: t("ai.diseaseDesc"), color: "bg-destructive/10 text-destructive", mode: "disease" },
    { icon: Leaf, title: t("ai.plantRecognition"), desc: t("ai.plantRecognitionDesc"), color: "bg-primary/10 text-primary", mode: "identify" },
    { icon: MapPin, title: t("ai.locationAnalysis"), desc: t("ai.locationAnalysisDesc"), color: "bg-accent/10 text-accent", mode: "location" },
  ];

  const handleFeatureClick = (mode: string) => {
    setPendingMode(mode);
    cameraRef.current?.click();
  };

  const handleCameraClick = () => {
    setPendingMode("chat");
    cameraRef.current?.click();
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
        messages: allMessages.filter(m => m.role !== "assistant" || allMessages.indexOf(m) !== 0), // skip initial greeting
        mode: "chat",
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setIsLoading(false);
    }
  };

  return (
    <div className="pb-24 max-w-lg mx-auto flex flex-col h-[calc(100vh-80px)]">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => e.target.files?.[0] && handlePhotoTaken(e.target.files[0])} />

      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t("ai.title")}</h1>
      </div>

      <div className="px-4 flex gap-3 overflow-x-auto pb-3 px-5">
        {displayFeatures.map((f, i) => (
          <motion.button key={f.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }} onClick={() => handleFeatureClick(f.mode)}
            className="min-w-[140px] bg-card rounded-xl p-3 shadow-card border border-border flex flex-col items-center gap-2 text-center">
            <div className={`w-10 h-10 rounded-lg ${f.color} flex items-center justify-center`}>
              <f.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-foreground">{f.title}</span>
            <span className="text-[10px] text-muted-foreground">{f.desc}</span>
          </motion.button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-3 mt-2">
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
      </div>

      <div className="px-4 py-3 flex items-center gap-2">
        <button onClick={handleCameraClick} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <Camera className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1 flex items-center bg-secondary rounded-full px-4 py-2">
          <input value={message} onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={t("ai.placeholder")}
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground" />
        </div>
        <button onClick={sendMessage} disabled={isLoading}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center disabled:opacity-50">
          <Send className="w-4 h-4 text-primary-foreground" />
        </button>
      </div>
    </div>
  );
};

export default AIAssistantPage;
