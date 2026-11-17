import { MeshStandardMaterial } from "three";
const colors = {
  ground: "#9da978",
  water: "#78b6c5",
  solar: "#e2b667",
  grain: "#c98855",
  wood: "#896348",
  cream: "#efe5cd",
  green: "#689d65",
  clay: "#c77b55",
  error: "#d94138",
} as const;
export type Swatch = keyof typeof colors;
// The sole material factory. Each mesh owns its material so selection/error feedback is isolated.
export function material(swatch: Swatch) {
  const result = new MeshStandardMaterial({
    color: colors[swatch],
    roughness: 1,
    flatShading: true,
  });
  result.userData.swatch = swatch;
  return result;
}

export function flagMaterial(target: MeshStandardMaterial, flagged: boolean) {
  target.color.set(
    colors[flagged ? "error" : (target.userData.swatch as Swatch)],
  );
  target.emissive.set(flagged ? "#a82018" : "#000000");
}
