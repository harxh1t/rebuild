import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { material, type Swatch } from "../../../scene/palette";
export type V3 = [number, number, number];
export function mesh<G extends T.BufferGeometry>(
  parent: T.Group,
  geometry: G,
  swatch: Swatch,
  position: V3 = [0, 0, 0],
  rotation: V3 = [0, 0, 0],
) {
  const m = new T.Mesh(geometry, material(swatch));
  m.position.set(...position);
  m.rotation.set(...rotation);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
export const box = (
  p: T.Group,
  s: V3,
  c: Swatch,
  at: V3 = [0, 0, 0],
  r: V3 = [0, 0, 0],
) => mesh(p, new T.BoxGeometry(...s), c, at, r);
export const cylinder = (
  p: T.Group,
  top: number,
  bottom: number,
  h: number,
  c: Swatch,
  at: V3 = [0, 0, 0],
  segments = 12,
) => mesh(p, new T.CylinderGeometry(top, bottom, h, segments), c, at);
export const ball = (p: T.Group, r: number, c: Swatch, at: V3 = [0, 0, 0]) =>
  mesh(p, new T.IcosahedronGeometry(r, 1), c, at);
export function beam(
  p: T.Group,
  a: V3,
  b: V3,
  width: number,
  c: Swatch = "timber",
) {
  const start = new T.Vector3(...a),
    end = new T.Vector3(...b);
  const m = box(p, [width, start.distanceTo(end), width], c);
  m.position.copy(start.add(end).multiplyScalar(0.5));
  m.quaternion.setFromUnitVectors(
    new T.Vector3(0, 1, 0),
    new T.Vector3(...b).sub(new T.Vector3(...a)).normalize(),
  );
  return m;
}
export function pipe(p: T.Group, points: V3[], radius = 0.09) {
  for (let i = 0; i < points.length - 1; i++) {
    const a = new T.Vector3(...points[i]),
      b = new T.Vector3(...points[i + 1]);
    const m = cylinder(p, radius, radius, a.distanceTo(b), "copper");
    m.position.copy(a.clone().add(b).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(
      new T.Vector3(0, 1, 0),
      b.sub(a).normalize(),
    );
    ball(p, radius * 1.1, "copper", points[i]);
  }
  points.forEach((pt) => ball(p, radius * 1.06, "copper", pt));
}
export function ring(
  p: T.Group,
  r: number,
  tube: number,
  c: Swatch,
  at: V3,
  rot: V3 = [Math.PI / 2, 0, 0],
) {
  return mesh(p, new T.TorusGeometry(r, tube, 6, 16), c, at, rot);
}
export function pot(p: T.Group, at: V3, scale = 1, c: Swatch = "clay") {
  const g = new T.Group();
  g.position.set(...at);
  g.scale.setScalar(scale);
  const pts = [
    new T.Vector2(0.23, 0),
    new T.Vector2(0.42, 0.13),
    new T.Vector2(0.48, 0.45),
    new T.Vector2(0.36, 0.7),
    new T.Vector2(0.26, 0.82),
    new T.Vector2(0.28, 0.9),
    new T.Vector2(0.21, 0.9),
    new T.Vector2(0.21, 0.82),
    new T.Vector2(0.3, 0.68),
    new T.Vector2(0.39, 0.45),
    new T.Vector2(0.32, 0.15),
  ];
  mesh(g, new T.LatheGeometry(pts, 14), c);
  ring(g, 0.25, 0.035, c, [0, 0.89, 0]);
  p.add(g);
  return g;
}
export function barrel(p: T.Group, at: V3, scale = 1, open = true) {
  const g = new T.Group();
  g.position.set(...at);
  g.scale.setScalar(scale);
  const count = 16;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    box(
      g,
      [0.205, 1, 0.1],
      i % 3 === 0 ? "wood" : "timber",
      [Math.sin(a) * 0.51, 0.5, Math.cos(a) * 0.51],
      [0, a, 0],
    );
  }
  ring(g, 0.56, 0.035, "iron", [0, 0.16, 0]);
  ring(g, 0.56, 0.035, "iron", [0, 0.81, 0]);
  cylinder(g, 0.49, 0.49, 0.04, open ? "water" : "wood", [
    0,
    open ? 0.87 : 1,
    0,
  ]);
  p.add(g);
  return g;
}
export function roof(
  p: T.Group,
  width: number,
  depth: number,
  eaves: number,
  rise: number,
  at: V3 = [0, 0, 0],
) {
  const g = new T.Group();
  g.position.set(...at);
  p.add(g);
  const half = width / 2,
    angle = Math.atan2(rise, half),
    length = Math.hypot(half, rise);
  for (const sign of [-1, 1]) {
    box(
      g,
      [length + 0.12, 0.12, depth + 0.2],
      "timber",
      [(sign * half) / 2, eaves + rise / 2, 0],
      [0, 0, -sign * angle],
    );
    const rows = Math.ceil(length / 0.46),
      cols = Math.ceil(depth / 0.34);
    for (let i = 0; i < rows; i++)
      for (let j = 0; j < cols; j++) {
        const x = ((i + 0.5) / rows) * half;
        const tile = mesh(
          g,
          tileGeometry(length / rows + 0.07, 0.35),
          (["tile", "tileLight", "tile", "tileDark"] as const)[
            (i * 7 + j * 3) % 4
          ],
          [
            sign * x,
            eaves + rise * (1 - x / half) + 0.09,
            ((j + 0.5) * depth) / cols - depth / 2,
          ],
          [0, 0, -sign * angle],
        );
        tile.name = "clay_tile";
      }
    beam(
      g,
      [sign * half, eaves, -depth / 2],
      [sign * half, eaves, depth / 2],
      0.16,
    );
  }
  for (let j = 0; j < Math.ceil(depth / 0.38); j++) {
    const m = cylinder(g, 0.15, 0.15, 0.4, "tileLight", [
      0,
      eaves + rise + 0.13,
      j * 0.38 - depth / 2,
    ]);
    m.rotation.x = Math.PI / 2;
  }
  for (const z of [-depth / 2, depth / 2]) {
    beam(g, [-half, eaves, z], [0, eaves + rise, z], 0.18);
    beam(g, [0, eaves + rise, z], [half, eaves, z], 0.18);
  }
  return g;
}
function tileGeometry(length: number, width: number) {
  const positions: number[] = [],
    indices: number[] = [];
  for (let i = 0; i < 2; i++)
    for (let j = 0; j <= 6; j++) {
      const a = (j / 6) * Math.PI;
      positions.push(
        (i - 0.5) * length,
        0.085 * Math.sin(a),
        (Math.cos(a) * width) / 2,
      );
    }
  for (let j = 0; j < 6; j++)
    indices.push(j, j + 7, j + 1, j + 1, j + 7, j + 8);
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
export function plant(p: T.Group, at: V3, size = 0.5) {
  const g = new T.Group();
  g.position.set(...at);
  for (let i = 0; i < 5; i++) {
    const a = i * 2.4;
    const leaf = mesh(
      g,
      new T.ConeGeometry(0.09 * size, 0.65 * size, 4),
      "leaf",
      [Math.sin(a) * 0.11 * size, 0.24 * size, Math.cos(a) * 0.11 * size],
    );
    leaf.rotation.z = Math.sin(a) * 0.6;
    leaf.rotation.x = Math.cos(a) * 0.6;
  }
  p.add(g);
  return g;
}
export function person(p: T.Group, at: V3, child = false) {
  const g = new T.Group();
  g.position.set(...at);
  if (child) g.scale.setScalar(0.75);
  cylinder(g, 0.24, 0.3, 0.63, child ? "grain" : "rio", [0, 0.85, 0], 8);
  ball(g, 0.22, "skin", [0, 1.42, 0]);
  ball(g, 0.225, "timber", [0, 1.51, -0.04]);
  cylinder(g, 0.1, 0.09, 0.55, "timber", [-0.14, 0.3, 0], 6);
  cylinder(g, 0.1, 0.09, 0.55, "timber", [0.14, 0.3, 0], 6);
  beam(g, [-0.26, 1.06, 0], [-0.35, 0.68, 0.1], 0.13, "skin");
  beam(g, [0.26, 1.06, 0], [0.38, 0.8, 0.22], 0.13, "skin");
  box(g, [0.11, 0.06, 0.04], "dark", [-0.08, 1.44, 0.19]);
  box(g, [0.11, 0.06, 0.04], "dark", [0.08, 1.44, 0.19]);
  if (!child) {
    ring(g, 0.26, 0.04, "cream", [0, 1.65, 0]);
    cylinder(g, 0.2, 0.25, 0.1, "cream", [0, 1.68, 0]);
    box(g, [0.25, 0.3, 0.02], "cream", [0, 0.87, 0.25]);
  }
  p.add(g);
  return g;
}
// Bake static surfaces by swatch: roof tiles and masonry cost one draw call per colour.
export function batch(group: T.Group) {
  group.updateMatrixWorld(true);
  const bins = new Map<Swatch, T.BufferGeometry[]>();
  const inverse = new T.Matrix4().copy(group.matrixWorld).invert();
  group.traverse((obj) => {
    if (obj instanceof T.Mesh) {
      const swatch = obj.material.userData.swatch as Swatch;
      const copy = obj.geometry.index
        ? obj.geometry.toNonIndexed()
        : obj.geometry.clone();
      copy.deleteAttribute("uv");
      const geo = copy.applyMatrix4(
        new T.Matrix4().multiplyMatrices(inverse, obj.matrixWorld),
      );
      const list = bins.get(swatch) ?? [];
      list.push(geo);
      bins.set(swatch, list);
      obj.geometry.dispose();
      obj.material.dispose();
    }
  });
  group.clear();
  for (const [color, geometries] of bins) {
    const geo = mergeGeometries(geometries, false);
    if (geo) mesh(group, geo, color).name = `static_${color}`;
    geometries.forEach((g) => g.dispose());
  }
  return group;
}
export function disposeGroup(group: T.Object3D) {
  group.traverse((o) => {
    if (o instanceof T.Mesh) {
      o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => m.dispose());
    }
  });
}
