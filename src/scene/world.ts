import * as THREE from "three";
import { gsap } from "gsap";
import { material } from "./palette";
import { landmarks } from "../village/landmarks";
import type { PuzzleScene } from "../engine/types";
export function createWorld(
  canvas: HTMLCanvasElement,
  onPick: (id: string) => void,
) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(12, 13, 18);
  const look = new THREE.Vector3(0, 0, 0);
  function scene() {
    const s = new THREE.Scene();
    s.background = new THREE.Color("#dce6df");
    s.fog = new THREE.Fog("#dce6df", 28, 65);
    s.add(new THREE.HemisphereLight("#fff3dc", "#71836c", 2.4));
    const sun = new THREE.DirectionalLight("#fff0d3", 3);
    sun.position.set(-8, 15, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -15;
    sun.shadow.camera.right = 15;
    sun.shadow.camera.top = 15;
    sun.shadow.camera.bottom = -15;
    s.add(sun);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      material("ground"),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    s.add(ground);
    return s;
  }
  const village = scene(),
    level = scene();
  let current = village;
  let active: PuzzleScene | null = null;
  let busy = false;
  landmarks.forEach((l) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2, 2.4),
      material(l.color),
    );
    mesh.position.set(l.position[0], l.position[1], l.position[2]);
    mesh.userData.target = l.id;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    village.add(mesh);
  });
  function resize() {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener("resize", resize);
  const ray = new THREE.Raycaster();
  canvas.addEventListener("pointerup", (e) => {
    if (busy) return;
    const rect = canvas.getBoundingClientRect();
    ray.setFromCamera(
      new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      camera,
    );
    const hit = ray
      .intersectObjects(current.children, true)
      .find((h) => h.object.userData.target);
    if (hit) onPick(hit.object.userData.target as string);
  });
  let frames = 0,
    last = performance.now(),
    fps = 0;
  renderer.setAnimationLoop(() => {
    camera.lookAt(look);
    renderer.render(current, camera);
    frames++;
    if (performance.now() - last >= 1000) {
      fps = frames;
      frames = 0;
      last = performance.now();
    }
  });
  return {
    renderer,
    stats: () => `${fps} fps · ${renderer.info.render.calls} draw calls`,
    async enter(id: string) {
      const l = landmarks.find((x) => x.id === id)!;
      busy = true;
      await Promise.all([
        gsap.to(camera.position, {
          x: l.shot[0],
          y: l.shot[1],
          z: l.shot[2],
          duration: 0.7,
        }),
        gsap.to(look, {
          x: l.position[0],
          y: 1,
          z: l.position[2],
          duration: 0.7,
        }),
      ]);
      current = level;
      camera.position.set(0, 5, 9);
      look.set(0, 0.7, 0);
      busy = false;
    },
    show(p: PuzzleScene) {
      if (active) {
        level.remove(active.root);
        active.dispose();
      }
      active = p;
      level.add(p.root);
    },
    home() {
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(look);
      current = village;
      camera.position.set(12, 13, 18);
      look.set(0, 0, 0);
      if (active) {
        level.remove(active.root);
        active.dispose();
        active = null;
      }
      busy = false;
    },
  };
}
