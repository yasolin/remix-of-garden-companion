import { describe, it, expect } from "vitest";
import { insideRoom, lightLevel, readRoomMap } from "./roomMap";
describe("room map", () => {
  it("restores grid-off, wall windows and saved plant coordinates", () => {
    expect(readRoomMap({ grid: false, windows: ["south"], positions: { mint: { x: 40, y: 70 } } })).toMatchObject({ grid: false, windows: ["south"], positions: { mint: { x: 40, y: 70 } } });
  });
  it("prevents placing plants in the missing part of an L-shaped room", () => {
    expect(insideRoom({ x: 80, y: 20 }, "l-shape")).toBe(false);
    expect(insideRoom({ x: 30, y: 20 }, "l-shape")).toBe(true);
  });
  it("assigns brighter estimated light near a selected window", () => {
    expect(lightLevel({ x: 50, y: 90 }, ["south"])).toBe("bright");
    expect(lightLevel({ x: 50, y: 10 }, ["south"])).toBe("low");
  });
  it("keeps plants inside a custom outline", () => {
    const outline = [{ x: 10, y: 10 }, { x: 90, y: 10 }, { x: 50, y: 90 }];
    expect(insideRoom({ x: 50, y: 40 }, "custom", outline)).toBe(true);
    expect(insideRoom({ x: 85, y: 85 }, "custom", outline)).toBe(false);
  });
});