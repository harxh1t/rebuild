import * as T from "three";
import { gsap } from "gsap";
import { makeWaterPlant } from "./plant";
import {
  box,
  cylinder,
  ball,
  ring,
  pipe,
  pot,
  beam,
  person,
  disposeGroup,
} from "./primitives";
import { flagMaterial } from "../../../scene/palette";
export type Stage =
  "overview" | "collect" | "settle" | "filter" | "safe" | "boil" | "deliver";
export function createWaterWorld(
  canvas: HTMLCanvasElement,
  onPick: (id: string) => void,
) {
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const scene = new T.Scene();
  scene.background = new T.Color("#e9e4d5");
  scene.fog = new T.Fog("#e9e4d5", 35, 65);
  scene.add(new T.HemisphereLight("#fff2d3", "#88977a", 2));
  const sun = new T.DirectionalLight("#fff0cf", 3.2);
  sun.position.set(-7, 15, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -12,
    right: 12,
    top: 12,
    bottom: -12,
    near: 0.1,
    far: 45,
  });
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  const backdrop = new T.Group();
  const ground = box(backdrop, [200, 0.1, 200], "cream", [0, -0.55, 0]);
  ground.castShadow = false;
  scene.add(backdrop);
  const house = makeWaterPlant();
  scene.add(house);
  const camera = new T.PerspectiveCamera(36, 1, 0.1, 100);
  const target = new T.Vector3(0, 1.5, 0);
  camera.position.set(14, 11.5, 19);
  const station = new T.Group();
  station.position.set(-0.8, 0, 5.9);
  scene.add(station);
  let stage: Stage = "overview";
  let props = new T.Group();
  station.add(props);
  let water: T.Mesh<T.CylinderGeometry, T.MeshStandardMaterial> | null = null;
  let sediment: T.Mesh | null = null;
  let particles: T.Group | null = null;
  let lens: T.Group | null = null;
  let flame: T.Group | null = null;
  let steam: T.Group | null = null;
  let flow: T.Mesh<T.CylinderGeometry, T.MeshStandardMaterial> | null = null;
  let output: T.Mesh<T.CylinderGeometry, T.MeshStandardMaterial> | null = null;
  let slots: T.Group[] = [];
  let pours: T.Group | null = null;
  let wood: T.Group | null = null;
  let child: T.Group | null = null;
  let previous = performance.now(),
    elapsed = 0;
  let raf = 0;
  let frames = 0,
    last = performance.now(),
    fps = 0;
  let update: (dt: number) => void = () => {};
  let rotate = false;
  function resize() {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  function frame() {
    const now = performance.now();
    const dt = Math.min((now - previous) / 1000, 0.25);
    previous = now;
    elapsed += dt;
    update(dt);
    if (rotate) house.rotation.y += dt * 0.15;
    const t = elapsed;
    if (lens)
      lens.children.forEach((o, i) => {
        if (o.userData.germ) {
          o.rotation.z = Math.sin(t * 1.5 + i) * 0.25;
          o.position.y = o.userData.y + Math.sin(t * 2 + i) * 0.04;
        }
      });
    if (flame && flame.visible)
      flame.children.forEach(
        (o, i) => (o.scale.y = 0.85 + Math.sin(t * 12 + i) * 0.17),
      );
    if (steam && steam.visible)
      steam.children.forEach((o, i) => {
        o.position.y = 2.2 + ((t * 0.5 + i * 0.23) % 1.4);
        o.scale.setScalar(0.5 + ((t * 0.5 + i * 0.23) % 1.4) * 0.4);
      });
    camera.lookAt(target);
    renderer.render(scene, camera);
    if (++frames && performance.now() - last > 1000) {
      fps = frames;
      frames = 0;
      last = performance.now();
    }
    raf = requestAnimationFrame(frame);
  }
  frame();
  const ray = new T.Raycaster();
  function pick(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera(
      new T.Vector2(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      ),
      camera,
    );
    const hits = ray.intersectObjects(station.children, true);
    for (const hit of hits) {
      let o: T.Object3D | null = hit.object;
      while (o && o !== station) {
        if (o.userData.target) {
          onPick(o.userData.target);
          return;
        }
        o = o.parent;
      }
    }
  }
  canvas.addEventListener("pointerup", pick);
  function clear() {
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(target);
    station.remove(props);
    disposeGroup(props);
    props = new T.Group();
    station.add(props);
    water = null;
    sediment = null;
    particles = null;
    lens = null;
    flame = null;
    steam = null;
    flow = null;
    output = null;
    slots = [];
    pours = null;
    wood = null;
    child = null;
  }
  function table() {
    box(props, [4.8, 0.18, 2.15], "wood", [0, 0.82, 0]);
    for (const x of [-2, 2])
      for (const z of [-0.8, 0.8])
        box(props, [0.13, 0.75, 0.13], "timber", [x, 0.4, z]);
  }
  function jar(x: number, z = 0) {
    const g = new T.Group();
    g.position.set(x, 0.93, z);
    props.add(g);
    cylinder(g, 0.5, 0.46, 1.5, "glass", [0, 0.75, 0], 24);
    ring(g, 0.5, 0.035, "copper", [0, 1.5, 0]);
    ring(g, 0.46, 0.035, "copper", [0, 0.02, 0]);
    water = cylinder(g, 0.43, 0.43, 1.05, "mud", [0, 0.55, 0], 24);
    sediment = cylinder(g, 0.43, 0.43, 0.12, "mud", [0, 0.1, 0], 24);
    sediment.visible = false;
    particles = new T.Group();
    g.add(particles);
    for (let i = 0; i < 24; i++) {
      const a = i * 2.4;
      const dot = ball(particles, 0.035, "earth", [
        Math.cos(a) * 0.34,
        0.2 + (i % 9) * 0.1,
        Math.sin(a) * 0.34,
      ]);
      dot.userData.initialY = dot.position.y;
    }
    return g;
  }
  function magnifier() {
    lens = new T.Group();
    lens.position.set(1.15, 2.05, 0);
    props.add(lens);
    ring(lens, 0.69, 0.065, "brass", [0, 0, 0], [0, 0, 0]);
    const disk = cylinder(lens, 0.64, 0.64, 0.04, "water", [0, 0, 0], 32);
    disk.rotation.x = Math.PI / 2;
    beam(lens, [0.45, -0.48, 0], [0.83, -0.95, 0], 0.13, "wood");
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4;
      const germ = new T.Group();
      germ.position.set(Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0.08);
      germ.userData.germ = true;
      germ.userData.y = germ.position.y;
      const body = ball(germ, 0.09, i % 2 ? "leaf" : "clay");
      body.scale.set(1.5, 0.8, 0.6);
      for (let j = 0; j < 6; j++) {
        const r = (j / 6) * Math.PI * 2;
        beam(
          germ,
          [Math.cos(r) * 0.07, Math.sin(r) * 0.07, 0],
          [Math.cos(r) * 0.15, Math.sin(r) * 0.15, 0],
          0.015,
          "timber",
        );
      }
      lens.add(germ);
    }
    lens.visible = false;
  }
  function show(next: Stage) {
    clear();
    stage = next;
    house.rotation.y = 0;
    rotate = false;
    station.visible = next !== "overview";
    if (next === "overview") {
      gsap.to(camera.position, { x: 14, y: 11.5, z: 19, duration: 1.1 });
      gsap.to(target, { x: 0, y: 1.5, z: 0, duration: 1.1 });
      return;
    }
    gsap.to(camera.position, {
      x: 6.3,
      y: 6,
      z: 14.5,
      duration: 1.05,
      ease: "power2.inOut",
    });
    gsap.to(target, { x: -0.4, y: 1.35, z: 5.7, duration: 1.05 });
    if (next === "collect" || next === "settle") {
      table();
      jar(0.7);
      const bucket = new T.Group();
      bucket.position.set(-1.25, 0.94, 0);
      bucket.userData.target = "bucket";
      props.add(bucket);
      cylinder(bucket, 0.48, 0.35, 0.7, "wood", [0, 0.35, 0]);
      cylinder(bucket, 0.41, 0.41, 0.03, "mud", [0, 0.71, 0]);
      ring(bucket, 0.48, 0.03, "iron", [0, 0.65, 0]);
      ring(bucket, 0.36, 0.03, "iron", [0, 0.08, 0]);
      ring(bucket, 0.48, 0.035, "iron", [0, 0.95, 0], [0, 0, 0]);
      if (next === "collect" && water) {
        water.scale.y = 0.01;
        water.visible = false;
        particles!.visible = false;
      }
    }
    if (next === "filter") {
      table();
      const column = new T.Group();
      column.position.set(0.3, 0.95, 0);
      props.add(column);
      for (const x of [-0.63, 0.63])
        box(column, [0.09, 2.55, 0.1], "timber", [x, 1.25, -0.48]);
      for (const y of [0, 2.55])
        box(column, [1.5, 0.09, 1.2], "wood", [0, y, 0]);
      box(column, [1.18, 2.45, 1.04], "glass", [0, 1.25, 0]);
      for (let i = 0; i < 5; i++) {
        const slot = new T.Group();
        slot.position.set(0, 0.25 + i * 0.44, 0);
        slot.userData.target = `slot-${i}`;
        const base = box(slot, [1.13, 0.04, 0.98], "cream");
        base.material.transparent = true;
        base.material.opacity = 0.25;
        column.add(slot);
        slots.push(slot);
      }
      pipe(
        column,
        [
          [0.6, 0.15, 0],
          [1.05, 0.15, 0],
          [1.05, -0.15, 0],
        ],
        0.06,
      );
      pot(props, [1.4, 0.94, 0], 0.75);
      output = cylinder(props, 0.18, 0.18, 0.03, "water", [1.4, 1.42, 0]);
      output.visible = false;
      flow = cylinder(props, 0.055, 0.055, 0.6, "water", [1.4, 1.8, 0]);
      flow.visible = false;
      pours = new T.Group();
      pours.position.set(0.3, 3.9, 0);
      props.add(pours);
      cylinder(pours, 0.06, 0.06, 0.85, "mud");
      pours.visible = false;
    }
    if (next === "safe") {
      table();
      jar(-0.8);
      water!.material.color.set("#75b8c2");
      particles!.visible = false;
      sediment!.visible = false;
      magnifier();
    }
    if (next === "boil") {
      const hearth = new T.Group();
      hearth.userData.target = "hearth";
      props.add(hearth);
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5;
        box(
          hearth,
          [0.4, 0.3, 0.32],
          "stone",
          [Math.sin(a) * 0.65, 0.2, Math.cos(a) * 0.65],
          [0, a, 0],
        ).name = "hearth_stone";
      }
      wood = new T.Group();
      props.add(wood);
      for (let i = 0; i < 4; i++)
        beam(
          wood,
          [-0.5, 0.25 + i * 0.04, -0.2 + i * 0.13],
          [0.5, 0.25 + i * 0.04, 0.2 - i * 0.13],
          0.13,
          "wood",
        );
      wood.visible = false;
      flame = new T.Group();
      props.add(flame);
      for (let i = 0; i < 7; i++) {
        const a = i * 2.4;
        const f = ball(flame, 0.17, "flame", [
          Math.cos(a) * 0.25,
          0.55,
          Math.sin(a) * 0.25,
        ]);
        f.scale.y = 2.3;
      }
      flame.visible = false;
      for (const x of [-0.8, 0.8])
        beam(props, [x, 0, -0.4], [x * 0.5, 2.5, -0.4], 0.1, "iron");
      beam(props, [-0.4, 2.5, -0.4], [0.4, 2.5, -0.4], 0.1, "iron");
      const cauldron = pot(props, [0, 0.92, 0], 1.3, "iron");
      cauldron.userData.target = "pot";
      water = cylinder(props, 0.27, 0.27, 0.04, "water", [0, 2.05, 0], 20);
      steam = new T.Group();
      props.add(steam);
      for (let i = 0; i < 6; i++) {
        const s = ball(steam, 0.13, "cotton", [
          Math.sin(i * 2) * 0.3,
          2.2 + i * 0.2,
          0,
        ]);
        s.material.transparent = true;
        s.material.opacity = 0.45;
      }
      steam.visible = false;
      const pile = new T.Group();
      pile.userData.target = "wood";
      pile.position.set(-1.7, 0, 0.5);
      props.add(pile);
      for (let i = 0; i < 5; i++)
        beam(
          pile,
          [-0.4, 0.1 + i * 0.06, -0.2 + i * 0.1],
          [0.4, 0.1 + i * 0.06, 0.1 + i * 0.05],
          0.13,
          "wood",
        );
      magnifier();
      lens!.position.set(1.9, 2.05, 0);
    }
    if (next === "deliver") {
      pot(props, [0, 1.05, 0], 0.7);
      child = person(props, [2, 0, 0], true);
      gsap.to(camera.position, { x: 13, y: 9.5, z: 19, duration: 5 });
      gsap.to(target, { x: 0, y: 1.5, z: 0, duration: 5 });
    }
  }
  return {
    show,
    onUpdate: (fn: (dt: number) => void) => {
      update = fn;
    },
    stats: () => ({
      fps,
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
    }),
    lab: () => {
      show("overview");
      rotate = true;
    },
    fill: (n: number) => {
      if (water) {
        water.visible = true;
        water.scale.y = Math.max(0.01, n);
        water.position.y = 0.55 * n;
      }
      if (particles) particles.visible = n > 0.8;
    },
    settle: (n: number) => {
      if (water)
        water.material.color.lerpColors(
          new T.Color("#8c6942"),
          new T.Color("#b5ad7f"),
          n,
        );
      if (sediment) {
        sediment.visible = true;
        sediment.scale.y = 0.1 + n;
      }
      particles?.children.forEach(
        (o) =>
          (o.position.y = T.MathUtils.lerp(
            o.userData.initialY as number,
            0.14,
            n,
          )),
      );
    },
    filter: (layers: (string | null)[]) => {
      slots.forEach((slot, i) => {
        while (slot.children.length > 1) {
          const o = slot.children[1];
          disposeGroup(o);
          slot.remove(o);
        }
        if (layers[i]) {
          const swatch = (
            {
              cotton: "cotton",
              charcoal: "charcoal",
              fine: "fine",
              coarse: "coarse",
              pebbles: "pebbles",
            } as const
          )[layers[i] as "cotton"];
          const fill = box(slot, [1.09, 0.38, 0.94], swatch, [0, 0.16, 0]);
          fill.scale.y = 0.1;
          gsap.to(fill.scale, { y: 1, duration: 0.3, ease: "back.out(2)" });
          for (let j = 0; j < 9; j++)
            ball(slot, layers[i] === "pebbles" ? 0.08 : 0.035, swatch, [
              -0.42 + (j % 3) * 0.4,
              0.38,
              -0.32 + Math.floor(j / 3) * 0.3,
            ]);
        }
      });
    },
    pour: (visible: boolean, outcome: string) => {
      if (pours) pours.visible = visible;
      if (flow) {
        flow.visible = visible && outcome !== "clogged";
        flow.material.color.set(
          outcome === "clear"
            ? "#78b6c5"
            : outcome === "sandy"
              ? "#9a774d"
              : "#bbb18c",
        );
      }
      if (output) {
        output.visible = true;
        output.material.color.set(
          outcome === "clear"
            ? "#78b6c5"
            : outcome === "sandy"
              ? "#9a774d"
              : "#bbb18c",
        );
      }
      if (outcome === "clogged" && visible) {
        box(props, [1.1, 0.13, 1], "mud", [0.3, 3.5, 0]).name = "pool";
      } else {
        const pool = props.getObjectByName("pool");
        if (pool) {
          disposeGroup(pool);
          props.remove(pool);
        }
      }
    },
    highlight: (index: number) => {
      slots.forEach((slot, i) =>
        slot.traverse((o) => {
          if (o instanceof T.Mesh)
            o.material.emissive.set(i === index ? "#65521a" : "#000000");
        }),
      );
    },
    flag: (id?: string) => {
      props.traverse((o) => {
        if (o instanceof T.Mesh) {
          let p: T.Object3D | null = o;
          let match = false;
          while (p && p !== props) {
            if (p.userData.target === id && id) match = true;
            p = p.parent;
          }
          flagMaterial(o.material, match);
        }
      });
    },
    reveal: (clean = false) => {
      if (lens) {
        lens.visible = true;
        lens.children.forEach((o) => {
          if (o.userData.germ) o.visible = !clean;
        });
      }
    },
    fire: (hasWood: boolean, lit: boolean) => {
      if (wood) wood.visible = hasWood;
      if (flame) flame.visible = lit;
    },
    boiling: (yes: boolean) => {
      if (steam) steam.visible = yes;
    },
    delivery: (n: number) => {
      if (stage === "deliver") {
        props.position.x = Math.min(2, n * 2);
        if (child) child.position.x = 2 - props.position.x;
      }
    },
    dispose: () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointerup", pick);
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(target);
      disposeGroup(scene);
      renderer.dispose();
    },
  };
}
