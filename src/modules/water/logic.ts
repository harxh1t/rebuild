export const MATERIALS = [
  "cotton",
  "charcoal",
  "fine",
  "coarse",
  "pebbles",
] as const;
export type Layer = (typeof MATERIALS)[number];
export const LABELS: Record<Layer, string> = {
  cotton: "Cotton",
  charcoal: "Activated charcoal",
  fine: "Fine sand",
  coarse: "Coarse sand",
  pebbles: "Pebbles",
};
export type FilterResult = {
  outcome: "clear" | "sandy" | "cloudy" | "clogged";
  slot: number | null;
  why: string;
  misconception: string | null;
};
// A deliberately simplified model of this five-layer classroom apparatus, not all real filters.
export function checkFilter(layers: readonly (Layer | null)[]): FilterResult {
  if (layers[0] !== "cotton")
    return {
      outcome: "sandy",
      slot: 0,
      why: "Cotton belongs at the outlet. It helps hold the loose grains inside.",
      misconception: "filter_support_missing",
    };
  const fine = layers.indexOf("fine"),
    coarse = layers.indexOf("coarse"),
    pebbles = layers.indexOf("pebbles");
  if (
    fine >= 0 &&
    ((coarse >= 0 && fine > coarse) || (pebbles >= 0 && fine > pebbles))
  )
    return {
      outcome: "clogged",
      slot: fine,
      why: "In this model, fine sand meets the large dirt first and slows the flow. Let coarser layers meet it first.",
      misconception: "filter_layer_order",
    };
  if (layers[1] !== "charcoal")
    return {
      outcome: "cloudy",
      slot: 1,
      why: "Activated charcoal is missing from its place above the cotton. In this model, the water stays cloudy.",
      misconception: "filter_carbon_missing",
    };
  const index = MATERIALS.findIndex((m, i) => layers[i] !== m);
  if (index >= 0 || layers.length !== 5)
    return {
      outcome: "cloudy",
      slot: index < 0 ? 4 : index,
      why: "One layer is missing or out of place. Follow the water from the larger grains to the smaller grains.",
      misconception: "filter_layer_order",
    };
  return {
    outcome: "clear",
    slot: null,
    why: "The water looks clearer. We still need to check for germs.",
    misconception: null,
  };
}
export function placeLayer(
  layers: readonly (Layer | null)[],
  material: Layer,
  slot: number,
): (Layer | null)[] {
  const next = [...layers];
  if (!Number.isInteger(slot) || slot < 0 || slot > 4) return next;
  const old = next.indexOf(material),
    displaced = next[slot];
  if (old >= 0) next[old] = displaced;
  next[slot] = material;
  return next;
}
export const settleProgress = (progress: number, held: boolean, dt: number) =>
  Math.min(1, progress + (held ? Math.max(0, dt) / 4 : 0));
export interface HeatState {
  temperature: number;
  boiledSeconds: number;
  finished: boolean;
}
export function heatStep(
  s: HeatState,
  fanning: boolean,
  lit: boolean,
  dt: number,
): HeatState {
  if (s.finished) return s;
  const temperature = Math.max(
    25,
    Math.min(100, s.temperature + (lit ? (fanning ? 22 : -5) : -8) * dt),
  );
  const boiledSeconds = temperature >= 99.9 ? s.boiledSeconds + dt : 0;
  return { temperature, boiledSeconds, finished: boiledSeconds >= 2 };
}
