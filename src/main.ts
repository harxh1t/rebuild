import "./style.css";
import { createLogger } from "./data/log";
import { createPuzzle } from "./engine/puzzle";
import type { ModuleDefinition, PuzzleScene } from "./engine/types";
import { water } from "./modules/water/sample";
import { createWorld } from "./scene/world";
import { landmarks } from "./village/landmarks";
import { button, element } from "./ui/dom";
const params = new URLSearchParams(location.search);
const logger = createLogger(localStorage);
if (params.has("reset")) {
  logger.reset();
  localStorage.removeItem("rebuild.student");
  params.delete("reset");
  params.delete("jump");
  history.replaceState(null, "", `${location.pathname}?${params}`);
}
let student = params.has("demo")
  ? "S00"
  : (localStorage.getItem("rebuild.student") ?? "");
const ui = document.querySelector<HTMLDivElement>("#ui")!;
const modules: readonly ModuleDefinition[] = [water];
let actor: ReturnType<typeof createPuzzle> | null = null;
let puzzleScene: PuzzleScene | null = null;
let opening = false;
let navigation = 0;
let hintText = "";
let notice = "";
const world = createWorld(
  document.querySelector<HTMLCanvasElement>("#world")!,
  (id) => {
    if (actor) {
      if (actor.getSnapshot().matches("doing")) {
        puzzleScene?.select(id);
        actor.send({ type: "SELECT", id });
      }
    } else void openLandmark(id);
  },
);
function shell(title: string, subtitle: string) {
  ui.replaceChildren();
  const header = element("header");
  const brand = element("div");
  brand.append(
    element("small", "REBUILD / PALAMPUR"),
    element("h1", title),
    element("p", subtitle),
  );
  header.append(brand);
  const nav = element("nav");
  if (student) nav.append(element("span", `Student ${student}`));
  nav.append(button("Village", home), button("Learning log", showLogs));
  header.append(nav);
  ui.append(header);
  const warning = logger.store.getState().warning;
  if (warning) ui.append(element("aside", warning, "warning"));
}
function home() {
  navigation++;
  opening = false;
  actor?.stop();
  actor = null;
  puzzleScene = null;
  world.home();
  hintText = "";
  shell("Small steps. Real discoveries.", "Choose a landmark to begin.");
  const panel = element("section", "", "hub");
  panel.append(
    element("small", "YOUR VILLAGE"),
    element("h2", "What will you explore?"),
    element("p", "Clean Water is ready for a practice puzzle."),
  );
  landmarks.forEach((l) =>
    panel.append(
      button(
        `${l.name}  ${l.module ? "→" : "· Coming soon"}`,
        () => void openLandmark(l.id),
        "landmark",
      ),
    ),
  );
  if (notice) panel.append(element("p", notice, "note"));
  ui.append(panel);
  if (!student) login();
}
function login() {
  const overlay = element("div", "", "overlay");
  const form = element("form", "", "panel");
  form.append(
    element("small", "WELCOME, EXPLORER"),
    element("h2", "Your student code"),
    element("p", "Use the code your teacher gave you. No password needed."),
  );
  const label = element("label", "Student code");
  const input = element("input");
  input.name = "student";
  input.required = true;
  input.maxLength = 24;
  input.pattern = "[A-Za-z0-9_\\-]+";
  input.autocomplete = "off";
  label.append(input);
  form.append(label);
  const submit = element("button", "Let’s begin");
  submit.type = "submit";
  form.append(submit);
  form.onsubmit = (e) => {
    e.preventDefault();
    student = input.value.trim();
    if (!student) return;
    localStorage.setItem("rebuild.student", student);
    start();
  };
  overlay.append(form);
  ui.append(overlay);
  input.focus();
}
async function openLandmark(id: string) {
  if (opening) return;
  if (!student) {
    login();
    return;
  }
  const landmark = landmarks.find((l) => l.id === id);
  if (!landmark) return;
  if (!landmark.module) {
    notice = `${landmark.name}: Coming soon. Try the water house today!`;
    home();
    return;
  }
  const module = modules.find((m) => m.id === landmark.module)!;
  opening = true;
  const request = ++navigation;
  await world.enter(id);
  if (request !== navigation) return;
  opening = false;
  runPuzzle(module, 0);
}
function runPuzzle(module: ModuleDefinition, index: number) {
  actor?.stop();
  hintText = "";
  const definition = module.puzzles[index];
  puzzleScene = definition.setup();
  world.show(puzzleScene);
  actor = createPuzzle(definition, logger, student);
  actor.subscribe((snapshot) => {
    if (snapshot.matches("done")) {
      if (index + 1 < module.puzzles.length) runPuzzle(module, index + 1);
      else {
        notice = "Practice complete! You’re ready for the next discovery.";
        home();
      }
      return;
    }
    shell(
      module.title,
      `Practice ${index + 1} of ${module.puzzles.length} · ${definition.title}`,
    );
    const c = snapshot.context;
    const panel = element("section", "", "puzzle panel");
    panel.setAttribute("aria-live", "polite");
    panel.append(element("small", "RIO · YOUR ENGINEER FRIEND"));
    if (snapshot.matches("intro")) {
      definition.intro
        .slice(0, 2)
        .forEach((line) => panel.append(element("p", line)));
      panel.append(button("Let’s try", () => actor?.send({ type: "START" })));
    }
    if (snapshot.matches("predict")) {
      panel.append(element("h2", definition.prediction!.question));
      definition.prediction!.choices.forEach((choice) =>
        panel.append(
          button(choice.label, () =>
            actor?.send({ type: "PREDICT", id: choice.id }),
          ),
        ),
      );
    }
    if (snapshot.matches("confidence")) {
      panel.append(element("h2", "How sure are you?"));
      (["🤔 Not sure", "🙂 A bit sure", "😄 Very sure"] as const).forEach(
        (label, i) =>
          panel.append(
            button(label, () =>
              actor?.send({ type: "CONFIDENCE", value: (i + 1) as 1 | 2 | 3 }),
            ),
          ),
      );
    }
    if (snapshot.matches("doing")) {
      panel.append(
        element("h2", "Tap a box. Then check your idea."),
        element("p", "You can also use the buttons below."),
      );
      definition.targets.forEach((target) => {
        const b = button(
          target.label,
          () => {
            puzzleScene?.select(target.id);
            actor?.send({ type: "SELECT", id: target.id });
          },
          "secondary",
        );
        b.setAttribute("aria-pressed", String(c.selection === target.id));
        panel.append(b);
      });
      panel.append(
        button("Check", () => actor?.send({ type: "CHECK" })),
        button(
          "Hint",
          () => {
            hintText =
              definition.hints[Math.min(c.hint, definition.hints.length - 1)] ??
              "Look closely and try again.";
            actor?.send({ type: "HINT" });
          },
          "secondary",
        ),
      );
      if (hintText) panel.append(element("p", hintText, "note"));
      if (c.result && !c.result.correct) {
        puzzleScene?.flag(c.result.target);
        panel.append(
          element(
            "p",
            `⚑ ${definition.errors[c.result.cause ?? ""] ?? "Try another idea."}`,
            "error",
          ),
        );
      }
    }
    const predicted = definition.prediction?.choices.find(
      (x) => x.id === c.prediction,
    );
    if (
      c.result &&
      (c.result.correct || c.result.target) &&
      predicted &&
      !predicted.correct
    )
      panel.prepend(element("div", "Interesting surprise!", "surprise"));
    if (snapshot.matches("card")) {
      panel.append(
        element("small", "YOUR NOTEBOOK"),
        element("h2", "A discovery to keep"),
      );
      for (const [label, value] of Object.entries(definition.card))
        panel.append(
          element(
            "p",
            `${label === "belief" ? "An idea to test" : label === "why" ? "Why" : "Remember"}: ${value}`,
          ),
        );
      panel.append(
        button(
          index + 1 < module.puzzles.length ? "Next puzzle" : "Back to village",
          () => actor?.send({ type: "CONTINUE" }),
        ),
      );
    }
    ui.append(panel);
  });
  actor.start();
}
function showLogs() {
  home();
  shell(
    "Learning log",
    "Saved on this laptop · sample events are practice only",
  );
  const panel = element("section", "", "logs panel");
  const table = element("table");
  const head = element("tr");
  [
    "Event",
    "Student",
    "Puzzle",
    "Correct",
    "Confidence",
    "Misconception",
    "Answer",
  ].forEach((h) => head.append(element("th", h)));
  table.append(head);
  logger.store.getState().events.forEach((e) => {
    const row = element("tr");
    [
      e.type,
      e.studentCode,
      e.puzzleId,
      e.correct === null ? "—" : String(e.correct),
      e.confidence ?? "—",
      e.misconception ?? "—",
      e.answer ?? "—",
    ].forEach((v) => row.append(element("td", String(v))));
    table.append(row);
  });
  panel.append(table);
  if (!logger.store.getState().events.length)
    panel.append(element("p", "No discoveries recorded yet."));
  ui.append(panel);
}
function start() {
  home();
  if (!student) return;
  if (params.has("log")) {
    showLogs();
    return;
  }
  const jump = params.get("jump");
  if (jump) {
    const module = modules.find((m) => m.puzzles.some((p) => p.id === jump));
    if (module) {
      opening = true;
      const request = ++navigation;
      void world.enter(module.id).then(() => {
        if (request !== navigation) return;
        opening = false;
        runPuzzle(
          module,
          module.puzzles.findIndex((p) => p.id === jump),
        );
      });
    } else {
      notice = `We couldn’t find puzzle “${jump}”. Choose the water house to begin.`;
      home();
    }
  }
}
if (params.has("debug")) {
  const debug = element("output", "", "debug");
  document.body.append(debug);
  setInterval(() => (debug.textContent = world.stats()), 500);
}
start();
