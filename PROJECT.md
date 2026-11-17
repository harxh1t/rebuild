# Rebuild — project brief

## Current foundation decisions (user-approved overrides)

For this standalone foundation, use normal reference-inspired colours throughout. Do not build the grey state, colour-restoration effect, or completion makeover described in the original brief below. Water opens as a separate Three.js level scene in the same browser tab. The village is only a three-box launcher in this step; the detailed water plant and real water puzzles come in later prompts. Reset clears local progress, not colours. Work on `seat-a/foundation`; push to https://github.com/krtxnsh/rebuild only after explicit user approval. Do not push main automatically.

## The idea

Rebuild is a 3D learning game that runs in the browser. A storm has drained the village of Palampur of its colour and cut it off for 5 days. The player is a young engineer who, helped by a village engineer called Rio, restores the village by solving real science and maths puzzles. Each solved module brings one landmark back to colour.

It is for Class 5-8 students in rural Indian schools that have no lab and no trained STEM teacher, and for their teachers.

## What makes it different

Most learning games give a score. Rebuild finds out which specific wrong idea each child holds, and how sure they are of it, and tells the teacher what to teach tomorrow.

- Every puzzle asks the student to predict first, then say how sure they are, then test it.
- Every wrong prediction and every wrong quiz option is logged as a named misconception, for example clear_means_safe.
- A teacher report shows who is confidently wrong and gives a ready 5-minute class activity.

## The loop every puzzle follows

Rio says at most 2 short lines -> Predict (pick an answer) -> Confidence tap (3 faces: not sure, a bit sure, very sure) -> Do (hands-on task in 3D) -> See the result -> on failure, the exact cause glows red with one "why" line -> on success, a Notebook card states the wrong belief, why it is wrong, and the correct idea.

Rules: no timers. A wrong prediction is called an "interesting surprise", never "wrong". Text is always shown. Language is simple English for a 10-year-old.

## The three modules

1. Clean Water (chemistry), the flagship: collect muddy water, let it settle, build a 5-layer filter, discover that clear water still has germs, boil it, deliver it. The water house turns blue.
2. Power (physics): complete a circuit, see that current is not used up, sort conductors from insulators. The solar house turns yellow.
3. Rationing (maths): share grain equally, compare 1/4 with 1/8, make the stock last 5 days. The grain store turns orange.

## The six misconceptions we track

clear_means_safe, filtering_kills_germs, one_wire_enough, current_consumed, any_solid_conducts, bigger_denominator_bigger.

## What the finished product looks like

A judge watches for 2-3 minutes and sees:

1. A grey, colourless low-poly village with Rio standing by a fallen "Palampur" sign.
2. The player taps the water house; the camera flies in to a close-up puzzle.
3. The player predicts that clear water is safe and taps "very sure". A magnifier shows germs. A banner says "Interesting surprise!".
4. The player boils the water. The water house floods back to blue. This is the wow moment.
5. We open the teacher page: "9 of 30 students are sure clear water is safe to drink", with a ready class activity beside it.

## Visual direction

Low-poly, flat-shaded, warm picture-book style. Flat colours, no image textures. Mud and lime-washed walls, clay-tile roofs, a hand pump, clay pots, small fields, hills behind. Warm sunlight from the upper left, soft sky, light fog. UI is large, rounded and friendly, readable on a projector.

## Tools

Three.js (WebGL), TypeScript strict, Vite, XState v5 for the puzzle loop, GSAP for animation, Zustand and localStorage for data, Vitest for logic tests, Playwright for screenshots. No backend, no login server, no React. Everything runs locally on a laptop. Install current stable versions and pin them.

## Team

Three AI agents work in parallel on separate branches.

- Seat A: engine, village, characters, Water.
- Seat B: UI, login, opening, outro, Rationing.
- Seat C: data, quiz, teacher report, Ask Rio, Power.

Stay inside the folders the foundation prompt assigns to your seat, and ask before changing shared code.

## Out of scope

Accounts and passwords, a server or database, multiplayer, leaderboards, mobile layout, more than three modules, timers, scores that rank children.

## How to work

- You decide the file structure and code design. Keep it simple and data-driven so a new puzzle is new data, not new plumbing.
- Before coding, state your plan in 5 lines.
- Run the project and look at a screenshot of your own work before saying it is done.
- Finish every task with a section titled HOW TO TEST: the exact URL to open, numbered steps to click, what I should see after each step, and how to trigger one failure case. Then list anything that is unfinished or faked.

## Structure

| Folder / file                                                             | Owner                   | Purpose                                                      |
| ------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------ |
| `src/engine/`                                                             | Seat A; shared contract | XState v5 puzzle loop and typed puzzle/module definitions    |
| `src/scene/`, `src/village/`, `src/modules/water/`                        | Seat A                  | Renderer, palette, landmark data, Water/sample               |
| `src/characters/` (reserved)                                              | Seat A                  | Rio and player models in later steps                         |
| `src/ui/`, `src/style.css`, `src/modules/rationing/` (reserved)           | Seat B                  | Shared DOM UI, login/opening/outro and Rationing             |
| `src/data/`, `src/modules/power/`, `src/teacher/`, `src/quiz/` (reserved) | Seat C                  | Logs, Power, reports, quiz and Ask Rio                       |
| `src/main.ts`, root configuration, `tests/`                               | Shared                  | Bootstrap and integration; coordinate changes before editing |

Seat A provides the initial UI and logging scaffolding in this foundation. Seat B and C take ownership after handoff. Local branches `seat-b/ui-rationing` and `seat-c/data-power` share the tested foundation commit. No remote branch is published until approved.

### Adding puzzles and landmarks

Implement a `PuzzleDefinition` (see `src/engine/types.ts`) with a unique id, at most two intro lines, optional prediction choices, a `setup()` scene factory, target ids, a pure `check(selection)` function, error-cause text, hints and a Notebook card. Follow `src/modules/water/sample.ts`. Scene factories return selection/error feedback and disposal hooks; clickable meshes use `userData.target`. Add the definition to the module's ordered `puzzles` array. Continuing from a Notebook opens the next puzzle; the final card returns to the launcher. Register additional modules in `src/main.ts`. Keep game-specific science out of the reusable engine.

All landmark names, positions, close-up shots, material swatches and module links are in `src/village/landmarks.ts`. Replace placeholder geometry in the renderer later without changing puzzle or navigation contracts. Use only `material(swatch)` from `src/scene/palette.ts` to create materials, including future meshes. Each mesh owns its material and must dispose it when its level closes. This version deliberately has no restoration function.

The sample misconception `sample_color_mixup` is practice-only; it is not one of the six science misconceptions and must be excluded from science reports. Logs under `rebuild.events.v1` store ids, timestamps, student code, puzzle id, correctness, confidence and misconception; non-assessed events use null rather than invented values. Predictions are saved after the confidence tap so each prediction event contains both answers. `logger.quiz(...)` is the shared integration point for Seat C; no quiz page is built yet. Storage failures retain events in memory and display a warning. Student codes are stored locally; there is no account server.

### URL shortcuts

- `?demo`: use student S00 without the local code-entry screen.
- `?jump=sample`: open the named puzzle directly (enter a student code unless combined with demo).
- `?debug`: show frames per second and draw calls.
- `?log`: show saved events from all local students.
- `?reset`: clear Rebuild events and student code; cancel jump, retain normal colours. The parameter is removed after use to avoid repeat resets.
- Combine flags, e.g. `?demo&jump=sample&debug`.

### Run and test

Use a current Node.js LTS release satisfying Vite's Node requirement (20.19+ or 22.12+). Dependency versions are exact in package.json and package-lock.json; use `npm ci` on other laptops. No React, backend, remote fonts or runtime asset requests.

Run `npm run dev`, then open http://127.0.0.1:5173/?demo. `npm run build` checks strict TypeScript and builds production output; `npm test` tests persistence and the puzzle state loop. Install a browser with `npx playwright install chromium`, then run `npm run smoke`. On Windows, tests automatically fall back to installed Google Chrome if bundled Chromium is absent. Set `PLAYWRIGHT_CHANNEL=chrome` or `msedge` to choose explicitly. Stop the dev server before running smoke (it owns port 5173). Smoke tests launch and close their own local Vite server, click real 3D boxes, retry wrong then right, inspect logs, test shortcuts and touch, and fail on console/page errors. Screenshots are written to ignored `test-results/`.

### HOW TO TEST

1. Run `npm ci`, then `npm run dev`. Open http://127.0.0.1:5173/?demo&reset. Expect three coloured placeholder landmarks and student S00.
2. Select Solar house or Grain store. Expect a friendly Coming soon note. Select Water house. Expect a brief camera movement followed by a separate level with two coloured boxes and Rio's text.
3. Click Let's try, predict Left box, and choose Very sure. Click the left 3D box and Check. Expect red feedback on that box, its why-line, and Interesting surprise. Hint supplies a clue.
4. Select the right box and Check. Expect a Notebook card. Back to village returns to the launcher without any colour transformation.
5. Open http://127.0.0.1:5173/?demo&log. Expect prediction, failed/successful attempts, hint and completion events. Reload: events remain.
6. Open http://127.0.0.1:5173/?demo&jump=sample&debug. Expect the sample directly and live fps/draw calls. Use http://127.0.0.1:5173/?demo&reset&log to clear the log.
7. Run `npm run build` and `npm test`. Stop the dev server with Ctrl+C, then run `npm run smoke`. Expect successful build, unit tests and browser tests.

Unfinished by design: real Clean Water science tasks, detailed village/water plant/characters, Power, Rationing, production login/opening/outro, teacher report, quiz UI and Ask Rio. The three landmarks and sample boxes are placeholders. No colour restoration is included, as requested.
