import { ArrowLeft, Camera, PenLine, Sparkles, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { stages, stageLabels } from "@/data/mockData";

type AddMode = "select" | "manual" | "ai";

const AddPlantPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AddMode>("select");

  const [form, setForm] = useState({
    name: "",
    scientificName: "",
    placement: "",
    waterFrequency: "",
    sunlight: "",
    windSensitivity: "",
    currentStage: "planting" as string,
    temperature: "",
    humidity: "",
    soilType: "",
    notes: "",
  });

  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  const handleAiAnalyze = () => {
    setAiAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setForm({
        name: "Lavanta",
        scientificName: "Lavandula angustifolia",
        placement: "Güneşli balkon",
        waterFrequency: "Haftada 2 kez",
        sunlight: "Tam güneş",
        windSensitivity: "Düşük",
        currentStage: "flowering",
        temperature: "15-30°C",
        humidity: "%40-60",
        soilType: "Kumlu, iyi drene olan toprak",
        notes: "Kurak ortamı sever, fazla sulamaktan kaçının",
      });
      setAiAnalyzing(false);
      setMode("manual");
    }, 2000);
  };

  const handleSave = () => {
    // In a real app, save to backend
    navigate("/my-plants");
  };

  if (mode === "select") {
    return (
      <div className="pb-24 max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Bitki Ekle</h1>
        </div>

        <div className="px-4 mt-8 space-y-4">
          <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setMode("manual")}
            className="w-full bg-card rounded-2xl p-6 shadow-card border border-border flex items-center gap-4 hover:bg-secondary transition-colors"
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <PenLine className="w-7 h-7 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-foreground text-lg">Manuel Giriş</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Bitki bilgilerini kendiniz doldurun
              </p>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={handleAiAnalyze}
            className="w-full gradient-help rounded-2xl p-6 shadow-card flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-primary-foreground text-lg">AI ile Ekle</h3>
              <p className="text-sm text-primary-foreground/80 mt-0.5">
                Fotoğraf çek, AI bitki bilgilerini otomatik doldursun
              </p>
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  if (aiAnalyzing) {
    return (
      <div className="pb-24 max-w-lg mx-auto flex flex-col items-center justify-center h-[80vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">AI Analiz Ediyor...</h2>
          <p className="text-sm text-muted-foreground text-center px-8">
            Bitkinin fotoğrafı analiz ediliyor ve bakım kartı hazırlanıyor
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => setMode("select")} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Bitki Bilgileri</h1>
      </div>

      {/* Photo upload area */}
      <div className="px-4 mt-3">
        <button className="w-full h-40 rounded-2xl border-2 border-dashed border-border bg-secondary/50 flex flex-col items-center justify-center gap-2 hover:bg-secondary transition-colors">
          <Camera className="w-8 h-8 text-muted-foreground" />
          <span className="text-sm font-semibold text-muted-foreground">Fotoğraf Ekle</span>
        </button>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {[
          { label: "Bitki Adı", key: "name", placeholder: "Ör: Kiraz Domates" },
          { label: "Bilimsel Ad", key: "scientificName", placeholder: "Ör: Solanum lycopersicum" },
          { label: "Konum", key: "placement", placeholder: "Ör: Balkon, Mutfak penceresi" },
          { label: "Sulama Sıklığı", key: "waterFrequency", placeholder: "Ör: Her gün" },
          { label: "Güneş İhtiyacı", key: "sunlight", placeholder: "Ör: Tam güneş" },
          { label: "Rüzgar Hassasiyeti", key: "windSensitivity", placeholder: "Ör: Orta" },
          { label: "Sıcaklık Aralığı", key: "temperature", placeholder: "Ör: 20-30°C" },
          { label: "Nem Oranı", key: "humidity", placeholder: "Ör: %60-80" },
          { label: "Toprak Tipi", key: "soilType", placeholder: "Ör: Humuslu toprak" },
        ].map((field) => (
          <div key={field.key}>
            <label className="text-sm font-semibold text-foreground">{field.label}</label>
            <input
              value={(form as any)[field.key]}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              placeholder={field.placeholder}
              className="w-full mt-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        ))}

        {/* Growth stage select */}
        <div>
          <label className="text-sm font-semibold text-foreground">Büyüme Aşaması</label>
          <div className="flex gap-2 mt-2 flex-wrap">
            {stages.map((stage) => (
              <button
                key={stage}
                onClick={() => setForm({ ...form, currentStage: stage })}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  form.currentStage === stage
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {stageLabels[stage]}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-semibold text-foreground">Notlar</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Ek notlarınız..."
            rows={3}
            className="w-full mt-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 mt-2"
        >
          <Save className="w-5 h-5" />
          Bitkiyi Kaydet
        </motion.button>
      </div>
    </div>
  );
};

export default AddPlantPage;
