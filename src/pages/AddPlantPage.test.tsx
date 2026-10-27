import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AddPlantPage from "./AddPlantPage";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), state: {} as Record<string, unknown>,
  fetch: vi.fn(), create: vi.fn(), update: vi.fn(), insert: vi.fn(), upload: vi.fn(), plan: vi.fn(),
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate, useLocation: () => ({ state: mocks.state }) }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: "tr" } }) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "owner" } }) }));
vi.mock("@/lib/locationService", () => ({ fetchUserLocations: mocks.fetch, createLocation: mocks.create, updateLocation: mocks.update }));
vi.mock("@/lib/plantService", () => ({ insertPlant: mocks.insert, uploadPlantPhoto: mocks.upload }));
vi.mock("@/lib/wateringService", () => ({ generateWateringPlan: mocks.plan, frequencyToDays: () => 3 }));
vi.mock("@/lib/plantAI", () => ({ analyzePlantPhoto: vi.fn() }));
vi.mock("@/components/PlantTypePicker", () => ({ default: () => null }));

function openDraft(locationId = "") {
  const file = new File(["photo"], "basil.jpg", { type: "image/jpeg" });
  mocks.state = {
    draft: { form: { name: "Fesleğen", scientificName: "Ocimum basilicum", placement: "Balkon", waterFrequency: "3 gün", sunlight: "Güneş", windSensitivity: "", currentStage: "planted", temperature: "", humidity: "", soilType: "", notes: "Taslak notu", fertilizer: "", plantedDate: "2026-10-27", lastWateredDate: "", neverWatered: true, locationId, category: "", direction: "", sunExposure: "", locationAnalyzed: false }, photoFile: file, photoPreview: "blob:plant-draft", newLocationName: "" },
    locationResult: { direction: "Güney", sunExposure: "Tam güneş" },
  };
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AddPlantPage /></QueryClientProvider>);
  return file;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.fetch.mockResolvedValue([{ id: "balcony", name: "Balkon" }]);
  mocks.insert.mockResolvedValue({ id: "plant" });
  mocks.upload.mockResolvedValue("https://example.test/basil.jpg");
  mocks.create.mockResolvedValue({ id: "new-balcony" });
  mocks.update.mockResolvedValue(undefined);
  mocks.plan.mockResolvedValue([]);
});
afterEach(cleanup);

describe("plant draft saving after location analysis", () => {
  it("retains the unsaved photo and fields when saving the returned draft", async () => {
    const file = openDraft("balcony");
    fireEvent.click(screen.getByRole("button", { name: "add.savePlant" }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith("/plant/plant"));
    expect(mocks.upload).toHaveBeenCalledWith("owner", file);
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ name: "Fesleğen", notes: "Taslak notu", photo_url: "https://example.test/basil.jpg", location_id: "balcony", direction: "Güney" }));
  });
  it("persists analysis on the already selected location", async () => {
    openDraft("balcony");
    fireEvent.click(screen.getByRole("button", { name: "add.savePlant" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith("balcony", { direction: "Güney", sun_exposure: "Tam güneş", ai_analyzed: true }));
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("reuses a matching owner location instead of creating a duplicate", async () => {
    openDraft();
    fireEvent.click(screen.getByRole("button", { name: "add.savePlant" }));
    await waitFor(() => expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ location_id: "balcony" })));
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("automatically creates a categorized location when none matches", async () => {
    mocks.fetch.mockResolvedValue([]);
    openDraft();
    fireEvent.click(screen.getByRole("button", { name: "add.savePlant" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ user_id: "owner", name: "Balkon", category: "balcony" })));
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ location_id: "new-balcony" }));
  });
});