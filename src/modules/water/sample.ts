import { BoxGeometry, Group, Mesh } from "three";
import { material, flagMaterial } from "../../scene/palette";
import type { ModuleDefinition, PuzzleDefinition } from "../../engine/types";
export const sample: PuzzleDefinition = {
  id: "sample",
  title: "Look, predict, try",
  intro: [
    "Let’s try our tools before cleaning water.",
    "Which box do you think is green?",
  ],
  prediction: {
    question: "Which box is green?",
    choices: [
      {
        id: "left",
        label: "Left box",
        correct: false,
        misconception: "sample_color_mixup",
      },
      { id: "right", label: "Right box", correct: true, misconception: null },
    ],
  },
  targets: [
    { id: "left", label: "Left box" },
    { id: "right", label: "Right box" },
  ],
  setup: () => {
    const root = new Group();
    const meshes = ["clay", "green"].map((color, i) => {
      const mesh = new Mesh(
        new BoxGeometry(1.7, 1.7, 1.7),
        material(color as "clay" | "green"),
      );
      mesh.position.set(i === 0 ? -1.5 : 1.5, 0.85, 0);
      mesh.userData.target = i === 0 ? "left" : "right";
      mesh.castShadow = true;
      root.add(mesh);
      return mesh;
    });
    return {
      root,
      select: (id) => {
        meshes.forEach((m) => {
          m.scale.setScalar(m.userData.target === id ? 1.1 : 1);
          flagMaterial(m.material, false);
        });
      },
      flag: (id) => {
        meshes.forEach((m) => {
          flagMaterial(m.material, m.userData.target === id);
        });
      },
      dispose: () =>
        meshes.forEach((m) => {
          m.geometry.dispose();
          m.material.dispose();
        }),
    };
  },
  check: (selection) =>
    selection === "right"
      ? { correct: true }
      : {
          correct: false,
          cause: selection ? "clay" : "empty",
          target: selection ?? undefined,
          misconception: selection ? "sample_color_mixup" : undefined,
        },
  errors: {
    clay: "This box is terracotta, like a clay pot. Look for the leafy green box.",
    empty: "Tap a box first, then press Check.",
  },
  hints: ["Look for the colour of a leaf.", "The green box is on the right."],
  card: {
    belief: "I thought the clay-coloured box was green.",
    why: "Clay is orange-brown. Leaves are often green.",
    idea: "Look closely, then test your idea. A surprise helps us learn.",
  },
};
export const water: ModuleDefinition = {
  id: "water",
  title: "Clean Water",
  puzzles: [sample],
};
