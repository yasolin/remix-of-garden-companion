export type Wall = "north" | "east" | "south" | "west";
export type Point = { x: number; y: number };
export interface RoomMapData {
  grid: boolean;
  windows: Wall[];
  positions: Record<string, Point>;
  outline: Point[];
  order: number;
}
export const WALLS: Wall[] = ["north", "east", "south", "west"];
export function readRoomMap(value: unknown, direction?: string | null): RoomMapData {
  const d = value && typeof value === "object" ? value as Partial<RoomMapData> : {};
  const windows = Array.isArray(d.windows) ? d.windows.filter(w => WALLS.includes(w)) : WALLS.filter((_, i) => (direction || "").toLowerCase().includes(["kuzey", "doğu", "güney", "batı"][i]) || (direction || "").toLowerCase().includes(WALLS[i]));
  return { grid: d.grid !== false, windows, positions: d.positions && typeof d.positions === "object" ? d.positions : {}, outline: Array.isArray(d.outline) ? d.outline : [], order: typeof d.order === "number" ? d.order : 0 };
}
export function insideRoom(point: Point, shape: string, outline: Point[] = []): boolean {
  if (point.x < 8 || point.x > 92 || point.y < 8 || point.y > 92) return false;
  if (shape === "l-shape") return !(point.x > 58 && point.y < 42);
  if (shape !== "custom" || outline.length < 3) return true;
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const a = outline[i], b = outline[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
export function lightLevel(point: Point, windows: Wall[]): "bright" | "medium" | "low" {
  if (!windows.length) return "low";
  const distance = Math.min(...windows.map(w => w === "north" ? point.y : w === "south" ? 100 - point.y : w === "east" ? 100 - point.x : point.x));
  return distance < 30 ? "bright" : distance < 65 ? "medium" : "low";
}