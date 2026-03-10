import { ArrowLeft, Plus, Sun, Droplets, Wind } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { myPlants } from "@/data/mockData";

const MyPlantsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Bitkilerim</h1>
            <p className="text-sm text-muted-foreground">{myPlants.length} bitki yetiştiriyorsunuz</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/add-plant")}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg"
        >
          <Plus className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>

      {/* Watering Reminder */}
      {myPlants.some(p => p.needsWatering) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-3 bg-accent/10 border border-accent/20 rounded-2xl p-4 flex items-center gap-3"
        >
          <Droplets className="w-8 h-8 text-primary" />
          <div>
            <h3 className="font-bold text-foreground">Bugün Unutma!</h3>
            <p className="text-sm text-muted-foreground">
              {myPlants.filter(p => p.needsWatering).map(p => p.name).join(", ")} sulanmalı 💧
            </p>
          </div>
        </motion.div>
      )}

      {/* Plant Grid */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        {myPlants.map((plant, i) => (
          <motion.div
            key={plant.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => navigate(`/plant/${plant.id}`)}
            className="bg-card rounded-2xl overflow-hidden shadow-card border border-border cursor-pointer relative"
          >
            <img
              src={plant.photo}
              alt={plant.name}
              className="w-full h-28 object-cover"
            />
            <div className="p-3">
              <h3 className="font-bold text-sm text-foreground">{plant.name}</h3>
              <p className="text-[10px] text-muted-foreground">{plant.scientificName}</p>
              <div className="flex gap-2 mt-2">
                <Sun className="w-3.5 h-3.5 text-accent" />
                <Droplets className="w-3.5 h-3.5 text-primary" />
                <Wind className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">📍 {plant.placement}</p>
            </div>
            {plant.daysToHarvest <= 7 && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                {plant.daysToHarvest} gün
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MyPlantsPage;
