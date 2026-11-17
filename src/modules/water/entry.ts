import { Group } from "three";
import { createWaterWorld } from "./art/world";
import { element, button } from "../../ui/dom";
import { createLogger } from "../../data/log";
import { createPuzzle } from "../../engine/puzzle";
import type {
  PuzzleDefinition,
  CheckResult,
  Confidence,
} from "../../engine/types";
import { APPLICATIONS, CONTENT, QUIZ, STEPS, type WaterStep } from "./content";
import {
  checkFilter,
  placeLayer,
  settleProgress,
  heatStep,
  MATERIALS,
  LABELS,
  type Layer,
  type HeatState,
} from "./logic";
import {
  loadProgress,
  newProgress,
  progressKey,
  type WaterProgress,
} from "./session";
export interface WaterOptions {
  studentCode?: string;
  storage?: Storage;
  onComplete?: (summary: { runId: string; cards: string[] }) => void;
}
export function mountWater(
  root: HTMLElement,
  canvas: HTMLCanvasElement,
  options: WaterOptions = {},
) {
  const storage = options.storage ?? localStorage,
    student = options.studentCode ?? "S00",
    params = new URLSearchParams(location.search),
    logger = createLogger(storage);
  let progress: WaterProgress = loadProgress(storage, student);
  if (params.has("reset")) {
    logger.reset();
    storage.removeItem(progressKey(student));
    progress = newProgress();
    params.delete("reset");
    history.replaceState(null, "", `${location.pathname}?${params}`);
  }
  let actor: ReturnType<typeof createPuzzle> | null = null,
    current: WaterStep = "collect",
    definition: PuzzleDefinition | null = null,
    mode = "welcome",
    hint = "",
    busy = false,
    holding = false,
    operation = "",
    elapsed = 0,
    settled = 0,
    selected: Layer | null = null,
    layers: (Layer | null)[] = Array(5).fill(null),
    hasWood = false,
    lit = false,
    heat: HeatState = { temperature: 25, boiledSeconds: 0, finished: false },
    lastResult: CheckResult = { correct: false },
    alive = true;
  let quizIndex = 0,
    quizAnswer: string | null = null,
    quizConfidence: Confidence | null = null,
    quizExplained = false;
  let meter: HTMLProgressElement | null = null,
    status: HTMLElement | null = null,
    temp: HTMLElement | null = null,
    panel: HTMLElement | null = null,
    startedDoing = false,
    layerLabel = -1;
  let delayed: () => void = () => {};
  const audioContexts: AudioContext[] = [];
  const world = createWaterWorld(canvas, (id) => interact(id));
  function save() {
    try {
      storage.setItem(progressKey(student), JSON.stringify(progress));
    } catch {
      /* Logger warning remains visible when saving is unavailable. */
    }
  }
  function stopHold() {
    holding = false;
  }
  addEventListener("blur", stopHold);
  const visibility = () => {
    if (document.hidden) stopHold();
  };
  document.addEventListener("visibilitychange", visibility);
  function header() {
    root.replaceChildren();
    const head = element("header", "", "water-header");
    const word = element("div", "REBUILD", "wordmark");
    word.append(element("span", "PALAMPUR · CHAPTER 01"));
    head.append(word);
    const nav = element("nav", "", "water-nav");
    nav.append(
      element("span", "THE WATER HOUSE", "chapter-tag"),
      ...(mode === "puzzle" && actor?.getSnapshot().matches("doing")
        ? [button("Ask Rio", showAskRio, "quiet ask-rio")]
        : []),
      button("Notebook", showNotebook, "quiet"),
      button("Learning log", showLogs, "quiet"),
    );
    head.append(nav);
    root.append(head);
    if (mode === "puzzle") {
      const steps = element("ol", "", "step-track");
      STEPS.forEach((s, i) => {
        const li = element(
          "li",
          `${i + 1}  ${s === "safe" ? "Look closer" : s[0].toUpperCase() + s.slice(1)}`,
          s === current
            ? "active"
            : progress.cards.includes(s)
              ? "visited"
              : "",
        );
        steps.append(li);
      });
      root.append(steps);
    }
    if (logger.store.getState().warning)
      root.append(
        element("p", logger.store.getState().warning!, "storage-warning"),
      );
  }
  function welcome() {
    actor?.stop();
    actor = null;
    mode = "welcome";
    world.show("overview");
    header();
    const card = element("section", "", "welcome-card");
    card.append(
      element("small", "A LITTLE SCIENCE. A BIG DIFFERENCE."),
      element("h1", "Every drop\nstarts a story."),
      element(
        "p",
        "The storm left the water muddy. Join Rio at the water house and find a way to make it safer.",
      ),
    );
    const resume = STEPS.includes(progress.step as WaterStep);
    card.append(
      button(
        resume ? "Continue your discovery" : "Begin Clean Water",
        () => start(resume ? (progress.step as WaterStep) : "collect"),
        "primary",
      ),
    );
    card.append(element("p", "Look. Predict. Try. Discover.", "caption"));
    root.append(card);
  }
  function start(step: WaterStep) {
    stopHold();
    actor?.stop();
    current = step;
    mode = "puzzle";
    hint = "";
    busy = false;
    operation = "";
    elapsed = 0;
    settled = 0;
    selected = null;
    layers = Array(5).fill(null);
    hasWood = false;
    lit = false;
    heat = { temperature: 25, boiledSeconds: 0, finished: false };
    startedDoing = false;
    layerLabel = -1;
    lastResult = { correct: false };
    progress.step = step;
    save();
    world.show(step);
    if (step === "deliver") playDeliveryChime();
    const c = CONTENT[step];
    definition = {
      id: `water.${step}`,
      title: c.title,
      intro: c.intro,
      prediction: c.prediction,
      setup: () => ({
        root: new Group(),
        select: () => {},
        flag: () => {},
        dispose: () => {},
      }),
      targets: [],
      check: () => lastResult,
      errors: {},
      hints: c.hints,
      card: c.card,
    };
    actor = createPuzzle(definition, logger, student, progress.runId);
    actor.subscribe((snapshot) => {
      if (!alive) return;
      if (snapshot.matches("done")) {
        next();
        return;
      }
      render();
      if (snapshot.matches("doing") && !startedDoing) {
        startedDoing = true;
        if (current === "safe") {
          beginOperation("reveal");
        }
        if (current === "deliver") {
          beginOperation("deliver");
        }
      }
    });
    actor.start();
    if (step === "deliver") actor.send({ type: "START" });
  }
  function next() {
    if (!progress.cards.includes(current)) progress.cards.push(current);
    const index = STEPS.indexOf(current);
    save();
    if (index < STEPS.length - 1) start(STEPS[index + 1]);
    else startQuiz();
  }
  function beginOperation(name: string) {
    operation = name;
    elapsed = 0;
    busy = true;
    render();
  }
  function result(value: CheckResult, why = "") {
    busy = false;
    operation = "";
    lastResult = value;
    if (definition && why) definition.errors[value.cause ?? "feedback"] = why;
    if (value.target) world.flag(value.target);
    actor?.send({ type: "CHECK" });
  }
  function action(label: string, fn: () => void, style = "primary") {
    const b = button(label, fn, style);
    b.disabled = busy;
    return b;
  }
  function holdButton(label: string) {
    const b = button(label, () => {}, "primary hold");
    b.setAttribute("aria-label", label);
    const down = (e: PointerEvent) => {
      if (busy) return;
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      holding = true;
      b.classList.add("holding");
    };
    const up = () => {
      holding = false;
      b.classList.remove("holding");
    };
    b.onpointerdown = down;
    b.onpointerup = up;
    b.onpointercancel = up;
    b.onlostpointercapture = up;
    b.onkeydown = (e) => {
      if ((e.code === "Space" || e.code === "Enter") && !busy) {
        e.preventDefault();
        holding = true;
        b.classList.add("holding");
      }
    };
    b.onkeyup = (e) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        up();
      }
    };
    b.onblur = up;
    b.disabled = busy;
    return b;
  }
  function render() {
    if (!actor) return;
    const snapshot = actor.getSnapshot(),
      ctx = snapshot.context,
      c = CONTENT[current];
    header();
    meter = null;
    status = null;
    temp = null;
    panel = element("section", "", "experiment-card");
    panel.setAttribute("aria-live", "polite");
    panel.append(element("small", c.eyebrow), element("h2", c.title));
    const rio = element("div", "", "rio-line");
    rio.append(
      element("span", "R", "rio-badge"),
      element("span", "RIO · YOUR ENGINEER FRIEND"),
    );
    panel.append(rio);
    if (snapshot.matches("intro")) {
      c.intro.forEach((line) => panel!.append(element("p", line)));
      panel.append(
        action(
          c.prediction
            ? "Make a prediction"
            : current === "collect"
              ? "Let’s collect"
              : "Let’s try",
          () => actor?.send({ type: "START" }),
        ),
      );
    }
    if (snapshot.matches("predict")) {
      panel.append(element("p", c.prediction!.question, "question"));
      c.prediction!.choices.forEach((choice) =>
        panel!.append(
          action(
            choice.label,
            () => actor?.send({ type: "PREDICT", id: choice.id }),
            "choice",
          ),
        ),
      );
    }
    if (snapshot.matches("confidence")) {
      panel.append(element("p", "How sure are you?", "question"));
      (["🤔 Not sure", "🙂 A bit sure", "😄 Very sure"] as const).forEach(
        (label, i) =>
          panel!.append(
            action(
              label,
              () =>
                actor?.send({
                  type: "CONFIDENCE",
                  value: (i + 1) as Confidence,
                }),
              "choice",
            ),
          ),
      );
    }
    if (snapshot.matches("doing")) {
      if (current === "collect") {
        panel.append(
          element(
            "p",
            "Tap the wooden bucket or use the button. Watch the jar fill.",
          ),
          action("Collect water", () => interact("bucket")),
        );
      }
      if (current === "settle") {
        panel.append(
          element(
            "p",
            "Hold Wait to leave the water still. Let go whenever you want to pause.",
          ),
          holdButton("Hold Wait"),
        );
        meter = element("progress");
        meter.max = 1;
        meter.value = settled;
        meter.setAttribute("aria-label", "Settling progress");
        panel.append(
          meter,
          element("p", "Time is sped up for our experiment.", "caption"),
        );
      }
      if (current === "filter") {
        panel.append(
          element(
            "p",
            "Choose a material, then a slot. Water flows from top to bottom.",
          ),
        );
        const rack = element("div", "", "slot-list");
        for (let i = 4; i >= 0; i--) {
          const b = action(
            `${i === 4 ? "Top" : i === 0 ? "Bottom" : `Layer ${i + 1}`}: ${layers[i] ? LABELS[layers[i]!] : "Empty"}`,
            () => interact(`slot-${i}`),
            "slot",
          );
          b.dataset.slot = String(i);
          if (lastResult.target === `slot-${i}`) b.classList.add("flagged");
          rack.append(b);
        }
        panel.append(
          rack,
          action("Pour water", () => interact("pour")),
        );
        const tray = element("aside", "", "materials-tray");
        tray.append(element("small", "YOUR FILTER MATERIALS"));
        const bags = element("div", "", "bag-grid");
        (
          ["coarse", "cotton", "pebbles", "charcoal", "fine"] as Layer[]
        ).forEach((m) => {
          const b = action(LABELS[m], () => interact(`bag-${m}`), "bag");
          b.dataset.material = m;
          b.setAttribute("aria-pressed", String(selected === m));
          const icon = element("span", "", "sack-icon");
          icon.dataset.material = m;
          b.prepend(icon);
          bags.append(b);
        });
        tray.append(
          bags,
          element(
            "p",
            selected
              ? `${LABELS[selected]} selected · tap a slot`
              : "Tap a sack to pick it up",
            "caption",
          ),
        );
        root.append(tray);
      }
      if (current === "safe") {
        panel.append(
          element("p", "Let’s look beyond what our eyes can see."),
          element(
            "p",
            "Illustrated microscopic view — an ordinary magnifying glass cannot show these germs.",
            "caption",
          ),
        );
      }
      if (current === "boil") {
        panel.append(
          element(
            "p",
            "Add wood, strike the flint, then hold Fan. An adult handles real boiling water.",
          ),
        );
        const controls = element("div", "", "two-buttons");
        controls.append(
          action(
            hasWood ? "Wood added ✓" : "Add wood",
            () => interact("wood"),
            "choice",
          ),
          action(
            lit ? "Fire lit ✓" : "Strike flint",
            () => interact("strike"),
            "choice",
          ),
        );
        panel.append(controls, holdButton("Hold Fan"));
        temp = element(
          "div",
          `${Math.round(heat.temperature)}°C`,
          "temperature",
        );
        panel.append(temp);
        meter = element("progress");
        meter.max = 100;
        meter.value = heat.temperature;
        meter.setAttribute("aria-label", "Water temperature");
        panel.append(
          meter,
          element(
            "p",
            "Time sped up · 100°C is an illustrative sea-level value. Boiling temperature is lower at altitude.",
            "caption",
          ),
        );
      }
      if (current === "deliver")
        panel.append(
          element("p", CONTENT.deliver.intro[elapsed > 3 ? 1 : 0]),
          element("p", "Cooled water · clean, covered container", "caption"),
        );
      status = element("p", busy ? operationText() : "", "experiment-status");
      status.setAttribute("role", "status");
      panel.append(status);
      if (ctx.result && !ctx.result.correct)
        panel.append(
          element(
            "p",
            `⚑ ${definition?.errors[ctx.result.cause ?? ""] ?? "Try another idea."}`,
            "error-note",
          ),
        );
      if (current !== "deliver") {
        const hintButton = action(
          "Need a hint?",
          () => {
            hint = c.hints[Math.min(ctx.hint, 2)];
            if (ctx.hint === 1 && current === "filter") world.flag("slot-0");
            actor?.send({ type: "HINT" });
          },
          "text-button",
        );
        panel.append(hintButton);
        if (hint) panel.append(element("p", hint, "hint-note"));
      }
    }
    const predicted = c.prediction?.choices.find(
      (choice) => choice.id === ctx.prediction,
    );
    if (ctx.result && predicted && !predicted.correct) {
      panel.prepend(element("div", "Interesting surprise!", "surprise"));
      if (current === "safe")
        panel.append(
          element(
            "p",
            "Rio: “I used to think clear meant safe, too. Now we know to check.”",
          ),
        );
    }
    if (snapshot.matches("card")) {
      panel.append(
        element("small", "A PAGE FOR YOUR NOTEBOOK"),
        element("h3", c.card.idea),
        element("p", `An idea to rethink: ${c.card.belief}`),
        element("p", c.card.why),
      );
      panel.append(
        action(current === "boil" ? "Let’s deliver" : "Keep discovering", () =>
          actor?.send({ type: "CONTINUE" }),
        ),
      );
    }
    root.append(panel);
  }
  function operationText() {
    return operation === "fill"
      ? "Collecting our sample…"
      : operation === "pour"
        ? "Watch what happens to the water…"
        : operation === "reveal"
          ? "Looking closer…"
          : operation === "boiled"
            ? "Rolling boil: 1 minute shown in fast motion."
            : operation === "cool"
              ? "Cooling the water, then covering the pot…"
              : operation === "deliver"
                ? "Sharing cooled, treated water…"
                : "";
  }
  function playDeliveryChime() {
    try {
      const AudioCtor = window.AudioContext;
      const context = new AudioCtor();
      audioContexts.push(context);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.5);
      gain.connect(context.destination);
      [523.25, 659.25, 783.99].forEach((frequency, index) => {
        const tone = context.createOscillator();
        tone.type = "sine";
        tone.frequency.value = frequency;
        tone.connect(gain);
        tone.start(context.currentTime + index * 0.16);
        tone.stop(context.currentTime + 1.5);
      });
    } catch {
      // Audio is decorative; silent browsers still get the complete visual scene.
    }
  }
  function interact(id: string) {
    if (!actor?.getSnapshot().matches("doing") || busy) return;
    if (current === "collect" && id === "bucket") {
      beginOperation("fill");
      return;
    }
    if (current === "filter") {
      if (id.startsWith("bag-")) {
        selected = id.slice(4) as Layer;
        actor.send({ type: "EDIT" });
        lastResult = { correct: false };
        render();
        return;
      }
      if (id.startsWith("slot-")) {
        if (!selected) {
          hint = "Choose a sack first, then tap a slot.";
          render();
          return;
        }
        actor.send({ type: "EDIT" });
        layers = placeLayer(layers, selected, Number(id.slice(5)));
        world.filter(layers);
        lastResult = { correct: false };
        render();
        return;
      }
      if (id === "pour") {
        const r = checkFilter(layers);
        world.pour(true, r.outcome);
        beginOperation("pour");
        return;
      }
    }
    if (current === "boil") {
      if (id === "wood") {
        actor.send({ type: "EDIT" });
        hasWood = true;
        world.fire(true, lit);
        lastResult = { correct: false };
        render();
        return;
      }
      if (id === "strike") {
        if (!hasWood) {
          result(
            { correct: false, cause: "wood", target: "hearth" },
            "The hearth is empty. Add wood so the fire has fuel.",
          );
          return;
        }
        actor.send({ type: "EDIT" });
        lit = true;
        world.fire(true, true);
        lastResult = { correct: false };
        render();
        return;
      }
    }
  }
  world.onUpdate((dt) => {
    if (!alive || mode !== "puzzle" || !actor?.getSnapshot().matches("doing"))
      return;
    if (current === "settle" && !busy) {
      settled = settleProgress(settled, holding, dt);
      world.settle(settled);
      if (meter) meter.value = settled;
      if (settled >= 1) {
        stopHold();
        result({ correct: true });
      }
      return;
    }
    if (current === "boil" && !busy) {
      heat = heatStep(heat, holding, lit, dt);
      if (temp) temp.textContent = `${Math.round(heat.temperature)}°C`;
      if (meter) meter.value = heat.temperature;
      if (heat.temperature >= 99.9) {
        world.boiling(true);
        if (status)
          status.textContent = "Rolling boil · 1 minute shown in fast motion.";
      } else if (status)
        status.textContent =
          holding && !lit
            ? "The fire needs wood and a spark."
            : lit
              ? "Keep fanning to reach a rolling boil."
              : "";
      if (heat.finished) {
        stopHold();
        beginOperation("cool");
        world.fire(true, false);
      }
      return;
    }
    if (!busy) return;
    elapsed += dt;
    if (operation === "fill") {
      world.fill(Math.min(1, elapsed / 1.2));
      if (elapsed >= 1.2) result({ correct: true });
    }
    if (operation === "reveal" && elapsed >= 1.4) {
      world.reveal();
      result({ correct: true });
    }
    if (operation === "pour") {
      const r = checkFilter(layers);
      if (elapsed >= 2) {
        world.pour(false, r.outcome);
        if (r.outcome !== "clear") {
          result(
            {
              correct: false,
              cause: "filter",
              target: `slot-${r.slot}`,
              misconception: r.misconception ?? undefined,
            },
            r.why,
          );
        } else {
          const index = 4 - Math.floor(elapsed - 2);
          if (index >= 0 && index !== layerLabel) {
            layerLabel = index;
            world.highlight(index);
            if (status)
              status.textContent = [
                "Cotton supports the loose layers.",
                "Activated charcoal traps some substances on its surface.",
                "Fine sand catches smaller bits.",
                "Coarse sand catches medium bits.",
                "Pebbles catch larger bits.",
              ][index];
          }
          if (elapsed >= 7) {
            world.highlight(-1);
            result({ correct: true });
          }
        }
      }
    }
    if (operation === "cool") {
      world.boiling(elapsed < 1.5);
      if (elapsed >= 3) {
        world.reveal(true);
        result({ correct: true });
      }
    }
    if (operation === "deliver") {
      world.delivery(Math.min(1, elapsed / 4));
      if (elapsed >= 6) {
        busy = false;
        operation = "";
        lastResult = { correct: true };
        actor.send({ type: "CHECK" });
        actor.send({ type: "CONTINUE" });
      }
    }
  });
  function modal(title: string) {
    stopHold();
    const overlay = element("div", "", "modal-shade");
    const sheet = element("section", "", "modal-sheet");
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-label", title);
    sheet.append(
      element("h2", title),
      button("Close", () => overlay.remove(), "quiet close"),
    );
    overlay.append(sheet);
    root.append(overlay);
    return sheet;
  }
  function showNotebook() {
    const sheet = modal("Your field notebook");
    const ids = [
      ...new Set([
        ...progress.cards,
        ...(actor?.getSnapshot().matches("card") ? [current] : []),
      ]),
    ];
    if (!ids.length)
      sheet.append(element("p", "Your discoveries will appear here."));
    ids.forEach((id) => {
      if (id in CONTENT) {
        const c = CONTENT[id as WaterStep];
        sheet.append(element("h3", c.title), element("p", c.card.idea));
      }
    });
  }
  function showLogs() {
    const sheet = modal("Learning log");
    const table = element("table");
    const head = element("tr");
    [
      "Event",
      "Puzzle",
      "Answer",
      "Correct",
      "Confidence",
      "Misconception",
    ].forEach((t) => head.append(element("th", t)));
    table.append(head);
    logger.store.getState().events.forEach((e) => {
      const row = element("tr");
      [
        e.type,
        e.puzzleId,
        e.answer ?? "—",
        String(e.correct),
        e.confidence === 3
          ? "Very sure"
          : e.confidence === 2
            ? "A bit sure"
            : e.confidence === 1
              ? "Not sure"
              : "—",
        e.misconception ?? "—",
      ].forEach((v) => row.append(element("td", v)));
      table.append(row);
    });
    sheet.append(table);
    if (!logger.store.getState().events.length)
      sheet.append(element("p", "No saved events yet."));
  }
  function showAskRio() {
    const sheet = modal("Ask Rio");
    sheet.append(
      element(
        "p",
        "Choose a question. Rio’s answers work without the internet.",
      ),
    );
    const answer = element("p", "What are you wondering about?", "rio-answer");
    CONTENT[current].chips.forEach((chip) =>
      sheet.append(
        button(
          chip.question,
          () => {
            answer.textContent = chip.answer;
          },
          "choice chip",
        ),
      ),
    );
    sheet.append(answer);
  }
  function startQuiz() {
    actor?.stop();
    actor = null;
    mode = "quiz";
    progress.step = "quiz";
    quizIndex = 0;
    quizAnswer = null;
    quizConfidence = null;
    quizExplained = false;
    save();
    world.show("overview");
    renderQuiz();
  }
  function renderQuiz() {
    const question = QUIZ[quizIndex];
    header();
    const card = element("section", "", "quiz-card");
    card.append(
      element("small", `VILLAGE CHECK-UP · ${quizIndex + 1} OF ${QUIZ.length}`),
      element("h2", question.question),
      element(
        "p",
        "No timer. Take your time and think like a scientist.",
        "caption",
      ),
    );
    if (!quizAnswer) {
      question.options.forEach((option) =>
        card.append(
          button(
            option.label,
            () => {
              quizAnswer = option.id;
              renderQuiz();
            },
            "choice",
          ),
        ),
      );
    } else if (!quizConfidence) {
      card.append(element("p", "How sure are you?", "question"));
      (["🤔 Not sure", "🙂 A bit sure", "😄 Very sure"] as const).forEach(
        (label, i) =>
          card.append(
            button(
              label,
              () => {
                quizConfidence = (i + 1) as Confidence;
                const option = question.options.find(
                  (item) => item.id === quizAnswer,
                )!;
                logger.quiz({
                  studentCode: student,
                  puzzleId: `water.quiz.${question.id}`,
                  answer: option.id,
                  correct: option.correct,
                  confidence: quizConfidence,
                  misconception: option.misconception,
                  concept: question.concept,
                  transfer: question.transfer,
                  runId: progress.runId,
                });
                quizExplained = true;
                renderQuiz();
              },
              "choice",
            ),
          ),
      );
    }
    if (quizExplained) {
      const option = question.options.find((item) => item.id === quizAnswer)!;
      card.append(
        element(
          "div",
          option.correct ? "Good thinking." : "Interesting surprise!",
          option.correct ? "quiz-result" : "surprise",
        ),
        element("p", question.explanation, "quiz-explanation"),
        button(
          quizIndex === QUIZ.length - 1
            ? "See where this helps"
            : "Next question",
          () => {
            if (quizIndex === QUIZ.length - 1) {
              progress.quizDone = true;
              save();
              showApplications();
            } else {
              quizIndex++;
              quizAnswer = null;
              quizConfidence = null;
              quizExplained = false;
              renderQuiz();
            }
          },
          "primary",
        ),
      );
    }
    root.append(card);
  }
  function showApplications() {
    mode = "applications";
    progress.step = "applications";
    save();
    header();
    const page = element("section", "", "applications-page");
    page.append(
      element("small", "FROM THE WATER HOUSE TO REAL LIFE"),
      element("h2", "Where this discovery helps"),
    );
    const grid = element("div", "", "application-grid");
    APPLICATIONS.forEach((item) => {
      const card = element("article", "", "application-card");
      const picture = element("div", "", `application-picture ${item.icon}`);
      picture.setAttribute("aria-hidden", "true");
      card.append(picture, element("h3", item.title), element("p", item.line));
      grid.append(card);
    });
    page.append(
      grid,
      button("Complete Module 1", finish, "primary complete-module"),
    );
    root.append(page);
  }
  function finish() {
    actor?.stop();
    actor = null;
    mode = "complete";
    progress.complete = true;
    progress.step = "complete";
    save();
    world.show("overview");
    header();
    const runEvents = logger.store
      .getState()
      .events.filter((event) => event.runId === progress.runId);
    const surprises = runEvents.filter(
      (event) => event.type === "prediction" && event.correct === false,
    ).length;
    const experiments = new Set(
      runEvents
        .filter((event) => event.type === "completion")
        .map((event) => event.puzzleId),
    ).size;
    const card = element("section", "", "welcome-card complete-card");
    card.append(
      element("small", "CLEAN WATER"),
      element("h1", "Module 1\ncomplete"),
      element(
        "p",
        "You collected, settled, filtered, checked, boiled and shared the water.",
      ),
      element(
        "div",
        `${progress.cards.length} Notebook cards · ${surprises} interesting surprises · ${experiments} experiments`,
        "completion-stats",
      ),
      button("Read your Notebook", showNotebook, "primary"),
      button(
        "Play again",
        () => {
          progress = newProgress();
          save();
          start("collect");
        },
        "choice",
      ),
    );
    root.append(card);
    options.onComplete?.({ runId: progress.runId, cards: progress.cards });
  }
  const debug = element("output", "", "water-debug");
  const debugTimer = setInterval(() => {
    if (params.has("debug") || params.has("lab")) {
      if (!debug.isConnected) root.append(debug);
      const s = world.stats();
      debug.textContent = `${s.fps} fps · ${s.calls} draws · ${s.triangles.toLocaleString()} triangles`;
      debug.dataset.fps = String(s.fps);
      debug.dataset.calls = String(s.calls);
      debug.dataset.triangles = String(s.triangles);
    }
  }, 500);
  const jump = params.get("jump")?.replace("water.", "");
  if (jump === "quiz") startQuiz();
  else if (jump && STEPS.includes(jump as WaterStep)) start(jump as WaterStep);
  else if (progress.step === "applications") showApplications();
  else if (progress.step === "quiz") startQuiz();
  else if (progress.complete && !params.has("reset")) finish();
  else welcome();
  if (params.has("lab")) world.lab();
  if (params.has("log")) showLogs();
  return () => {
    alive = false;
    actor?.stop();
    clearInterval(debugTimer);
    removeEventListener("blur", stopHold);
    document.removeEventListener("visibilitychange", visibility);
    audioContexts.forEach((context) => void context.close());
    world.dispose();
    root.replaceChildren();
  };
}
