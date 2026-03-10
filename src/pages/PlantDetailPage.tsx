import { ArrowLeft, Edit3, Sun, Droplets, Wind, Thermometer, CloudRain, MapPin, Sprout, Save, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { myPlants, stageLabels } from "@/data/mockData";
import GrowthTimeline from "@/components/GrowthTimeline";

const PlantDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const plant = myPlants.find((p) => p.id === id);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    name: plant?.name || "",
    placement: plant?.placement || "",
    waterFrequency: plant?.waterFrequency || "",
    sunlight: plant?.sunlight || "",
    windSensitivity: plant?.windSensitivity || "",
    temperature: plant?.temperature || "",
    humidity: plant?.humidity || "",
    soilType: plant?.soilType || "",
    fertilizer: plant?.fertilizer || "",
    notes: plant?.notes || "",
  });

  if (!plant) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Bitki bulunamadı</p>
      </div>
    );
  }

  const handleSave = () => {
    // In a real app, this would save to backend
    setIsEditing(false);
  };

  const infoItems = [
    { icon: Sun, label: "Güneş", value: form.sunlight, key: "sunlight" },
    { icon: Droplets, label: "Sulama", value: form.waterFrequency, key: "waterFrequency" },
    { icon: Wind, label: "Rüzgar", value: form.windSensitivity, key: "windSensitivity" },
    { icon: Thermometer, label: "Sıcaklık", value: form.temperature, key: "temperature" },
    { icon: CloudRain, label: "Nem", value: form.humidity, key: "humidity" },
    { icon: MapPin, label: "Konum", value: form.placement, key: "placement" },
  ];

  return (
    <div className="pb-24 max-w-lg mx-auto">
      {/* Header image */}
      <div className="relative">
        <img
          src={plant.photo}
          alt={plant.name}
          className="w-full h-56 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 rounded-full bg-background/60 backdrop-blur-sm"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="absolute top-4 right-4 p-2 rounded-full bg-background/60 backdrop-blur-sm"
        >
          {isEditing ? <X className="w-5 h-5 text-foreground" /> : <Edit3 className="w-5 h-5 text-foreground" />}
        </button>
      </div>

      {/* Plant info */}
      <div className="px-4 -mt-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-5 shadow-card border border-border"
        >
          <div className="flex items-center justify-between">
            <div>
              {isEditing ? (
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="text-xl font-bold text-foreground bg-secondary rounded-lg px-2 py-1 outline-none"
                />
              ) : (
                <h1 className="text-xl font-bold text-foreground">{form.name}</h1>
              )}
              <p className="text-sm text-muted-foreground italic">{plant.scientificName}</p>
            </div>
            <div className="flex items-center gap-2">
              <Sprout className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">{stageLabels[plant.currentStage]}</span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              plant.daysToHarvest <= 3
                ? "bg-primary text-primary-foreground"
                : plant.daysToHarvest <= 7
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}>
              Hasata {plant.daysToHarvest} gün
            </span>
            <span className="text-xs text-muted-foreground">
              Ekim: {new Date(plant.plantedDate).toLocaleDateString("tr-TR")}
            </span>
          </div>

          <GrowthTimeline currentStage={plant.currentStage} />
        </motion.div>

        {/* Care Info Grid */}
        <h2 className="text-lg font-bold text-foreground mt-6 mb-3">Bakım Bilgileri</h2>
        <div className="grid grid-cols-2 gap-3">
          {infoItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl p-3 shadow-card border border-border"
            >
              <div className="flex items-center gap-2 mb-1">
                <item.icon className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground">{item.label}</span>
              </div>
              {isEditing ? (
                <input
                  value={item.value}
                  onChange={(e) => setForm({ ...form, [item.key]: e.target.value })}
                  className="text-sm font-bold text-foreground bg-secondary rounded-lg px-2 py-1 w-full outline-none"
                />
              ) : (
                <p className="text-sm font-bold text-foreground">{item.value}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Additional info */}
        <div className="mt-4 space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl p-4 shadow-card border border-border"
          >
            <h3 className="text-sm font-bold text-foreground mb-1">🌱 Toprak Tipi</h3>
            {isEditing ? (
              <input
                value={form.soilType}
                onChange={(e) => setForm({ ...form, soilType: e.target.value })}
                className="text-sm text-muted-foreground bg-secondary rounded-lg px-2 py-1 w-full outline-none"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{form.soilType}</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-card rounded-xl p-4 shadow-card border border-border"
          >
            <h3 className="text-sm font-bold text-foreground mb-1">🧪 Gübreleme</h3>
            {isEditing ? (
              <input
                value={form.fertilizer}
                onChange={(e) => setForm({ ...form, fertilizer: e.target.value })}
                className="text-sm text-muted-foreground bg-secondary rounded-lg px-2 py-1 w-full outline-none"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{form.fertilizer}</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl p-4 shadow-card border border-border"
          >
            <h3 className="text-sm font-bold text-foreground mb-1">📝 Notlar</h3>
            {isEditing ? (
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="text-sm text-muted-foreground bg-secondary rounded-lg px-2 py-1 w-full outline-none resize-none"
                rows={2}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{form.notes}</p>
            )}
          </motion.div>
        </div>

        {isEditing && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleSave}
            className="w-full mt-4 bg-primary text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Kaydet
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default PlantDetailPage;
