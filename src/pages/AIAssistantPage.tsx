import { ArrowLeft, Camera, Send, Mic, Scan, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";

const features = [
  { icon: Scan, title: "Hastalık Tespiti", desc: "Bitkinizdeki hastalıkları tespit edin", color: "bg-destructive/10 text-destructive" },
  { icon: Leaf, title: "Bitki Tanıma", desc: "Fotoğraftan bitki türünü öğrenin", color: "bg-primary/10 text-primary" },
  { icon: Camera, title: "Konum Analizi", desc: "Bitkinizin konumunu AI ile analiz edin", color: "bg-accent/10 text-accent" },
];

const AIAssistantPage = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "Merhaba! 🌱 Ben bitki asistanınız. Size nasıl yardımcı olabilirim? Fotoğraf çekerek bitki hastalığı tespiti yapabilir veya sorularınızı yanıtlayabilirim." },
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: message },
      { role: "assistant", content: "Bu özellik yakında AI ile entegre edilecek. Şu an demo modundayız! 🌿" },
    ]);
    setMessage("");
  };

  return (
    <div className="pb-24 max-w-lg mx-auto flex flex-col h-[calc(100vh-80px)]">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">AI Asistan</h1>
      </div>

      {/* Feature Cards */}
      <div className="px-4 flex gap-3 overflow-x-auto pb-3 -mx-1 px-5">
        {features.map((f, i) => (
          <motion.button
            key={f.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="min-w-[140px] bg-card rounded-xl p-3 shadow-card border border-border flex flex-col items-center gap-2 text-center"
          >
            <div className={`w-10 h-10 rounded-lg ${f.color} flex items-center justify-center`}>
              <f.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-foreground">{f.title}</span>
            <span className="text-[10px] text-muted-foreground">{f.desc}</span>
          </motion.button>
        ))}
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 mt-2">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-[85%] p-3 rounded-2xl text-sm ${
              msg.role === "user"
                ? "ml-auto bg-primary text-primary-foreground rounded-br-md"
                : "bg-secondary text-secondary-foreground rounded-bl-md"
            }`}
          >
            {msg.content}
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 py-3 flex items-center gap-2">
        <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <Camera className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1 flex items-center bg-secondary rounded-full px-4 py-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Sorunuzu yazın..."
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          <button className="ml-2" onClick={() => {}}>
            <Mic className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <button
          onClick={sendMessage}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
        >
          <Send className="w-4 h-4 text-primary-foreground" />
        </button>
      </div>
    </div>
  );
};

export default AIAssistantPage;
