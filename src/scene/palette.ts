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
  plaster: "#e5deca",
  plasterShade: "#cdc7b0",
  timber: "#68503c",
  tile: "#bc653f",
  tileLight: "#d7824c",
  tileDark: "#9a4e34",
  stone: "#989f91",
  stoneLight: "#bcc0ad",
  earth: "#c5ae83",
  path: "#deca9d",
  grass: "#849459",
  leaf: "#567a4d",
  leafLight: "#9aab64",
  copper: "#a46e43",
  brass: "#d5ac55",
  iron: "#4c5650",
  dark: "#263f3f",
  glass: "#c0e3df",
  mud: "#8c6942",
  cotton: "#f3ecdc",
  charcoal: "#374441",
  fine: "#dbc08a",
  coarse: "#c0a477",
  pebbles: "#9c9b8c",
  flame: "#edab45",
  skin: "#b87d55",
  rio: "#517c75",
  flower: "#f3d990",
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
  if (swatch === "glass") {
    result.transparent = true;
    result.opacity = 0.2;
    result.depthWrite = false;
  }
  if (swatch === "water") {
    result.roughness = 0.25;
    result.metalness = 0.15;
  }
  return result;
}

export function flagMaterial(target: MeshStandardMaterial, flagged: boolean) {
  target.color.set(
    colors[flagged ? "error" : (target.userData.swatch as Swatch)],
  );
  target.emissive.set(flagged ? "#a82018" : "#000000");
}
