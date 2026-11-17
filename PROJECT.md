# Rebuild — Clean Water standalone level

## Current scope

Seat A builds only the complete Clean Water level that begins after the host game selects Level 1 and ends at the Module 1 completion screen. This checkout deliberately has no login, outer village, other landmarks, grey state, colour-restoration scene or post-level host screen. Use normal colours based on the supplied water-plant references. The host integrates the level through `mountWater(...)` and its `onComplete` callback.

Work on `seat-a/foundation`. Commit and push tested stages to that branch only; never push this work directly to `main`.

## Learning experience

Rebuild is for Class 5–8 students in rural and under-resourced Indian schools. Rio uses at most two short lines before an action. The recurring loop is Predict → confidence tap → hands-on experiment → visible result → exact cause and one why-line → Notebook card. There are no timers, scores or rankings. A mistaken idea is an “interesting surprise,” never labelled “wrong.” Text uses simple English and always remains visible.

The level runs in this order:

1. Collect muddy water.
2. Predict and observe settling; holding Wait advances it and releasing pauses it.
3. Build the filter bottom-to-top: cotton, activated charcoal, fine sand, coarse sand, pebbles. Consequences appear before explanations and the filter can be rebuilt.
4. Predict whether clear water is safe; an illustrated microscopic view reveals germs and logs `clear_means_safe`.
5. Predict whether the homemade filter removes all germs; add wood, strike a flint, fan to a rolling boil, cool and cover. This logs `filtering_kills_germs` when chosen.
6. Deliver the cooled treated water.
7. Answer four Village Check-up questions with confidence, including a rainwater transfer question.
8. View three real-life application cards, then the completion summary.

Ask Rio offers three offline chips during experiments and is hidden during predictions. The typed-question integration point exists but its box remains hidden until the shared service is available.

## Science language

The five-layer filter is a simplified classroom apparatus. Its approved order is cotton → activated charcoal → fine sand → coarse sand → pebbles, bottom to top. The game says this homemade filter removes dirt but cannot reliably remove germs; it does not claim that all filters behave identically.

Boiling animation uses accelerated game time. The UI says this explicitly. The Notebook tells students to ask an adult to bring water to a rolling boil for one minute, or three minutes above 2,000 m, then cool and store it covered. It labels 100°C as an illustrative sea-level value because boiling temperature changes with altitude. It also explains that boiling does not remove harmful chemicals. The germ view is illustrative and states that an ordinary magnifying glass cannot reveal germs.

## Visual direction

Low-poly, flat-shaded, warm picture-book style. The supplied references guide a lime-plastered timber water house with a broad terracotta-tile roof, exposed copper pipes and brass valves, raised barrel tank on a braced wooden tower, roofed stone well, filter basins, clay pots, plants and warm upper-left sunlight. Everything is built in Three.js code; there are no image textures, Blender files or downloaded models. Reference images live in `docs/ref/` and screenshots in `docs/screens/`.

## Tools

Pinned Vite, strict TypeScript, Three.js, XState v5, GSAP, Zustand/localStorage, Vitest and Playwright. There is no React, backend or runtime network dependency.

## Structure

| Path | Purpose |
| --- | --- |
| `src/modules/water/entry.ts` | Public mount/dispose API and complete level controller |
| `src/modules/water/content.ts` | Puzzle copy, Ask Rio chips, quiz and application content |
| `src/modules/water/logic.ts` | Pure filter, settling and heating rules |
| `src/modules/water/session.ts` | Per-student resumable progress |
| `src/modules/water/art/` | Procedural plant, props, animation and renderer |
| `src/engine/` | Reusable XState puzzle loop and shared definitions |
| `src/data/log.ts` | Persistent learning-event log |
| `src/scene/palette.ts` | The only material factory |
| `tests/` | Unit and full-level browser tests |
| `MODULE_WATER.md` | Merge contract, IDs, events and stand-ins |

To add a puzzle, supply a unique ID, at most two intro lines, optional prediction choices, a check result with exact failure cause, three progressive hints, three offline Rio chips and a Notebook card. Add it to the ordered controller and expand the smoke path. Keep science-specific state in `src/modules/water/`, not the shared engine.

## Learning data

Every prediction, attempt, hint, completion and quiz answer is stored under `rebuild.events.v1` with student code, puzzle ID, correctness, confidence, misconception and run ID. Quiz entries additionally carry concept and transfer metadata. Storage failures retain the session in memory and show a warning. Progress is stored under `rebuild.water.v1.<studentCode>`.

## URL shortcuts

- `?demo` uses demo student `S00`.
- `?jump=water.<id>` opens collect, settle, filter, safe, boil, deliver or quiz directly.
- `?debug` shows FPS, draw calls and triangles.
- `?log` opens the standalone learning log.
- `?reset` clears Water progress and log events.
- `?lab=water_house` shows the plant turntable.

## HOW TO TEST

1. Run `npm ci` and `npm run dev`; open http://127.0.0.1:5173/?demo&reset. The water plant appears directly, with no login or outer village.
2. Select **Begin Clean Water**. Collect the sample, make a confident “mud floats” prediction, release Wait halfway to verify it pauses, then finish settling.
3. In Filter, try an invalid order and pour. The consequence appears, then the exact slot is flagged. Rebuild bottom-to-top as cotton, activated charcoal, fine sand, coarse sand, pebbles and pour again.
4. In Look closer, choose “Yes, it looks clean” and Very sure. The illustrated germ view and Interesting surprise appear.
5. In Boil, choose “filtering removes all germs.” Strike without wood to trigger the empty-hearth failure, then add wood, strike and hold Fan. The water reaches a rolling boil, cools and becomes ready to deliver.
6. Complete Deliver, the four Check-up questions, and the three application cards. The completion screen shows six Notebook cards, surprises and experiments.
7. Open `?log`; confirm `clear_means_safe`, `filtering_kills_germs` and `water.quiz.rain` are saved with confidence. Reload the completion screen to verify progress persists. `?reset` starts a fresh run.
8. Stop the dev server, then run `npm run build`, `npm test` and `npm run smoke`. Expect a successful strict build, all unit tests, and the full browser path with no console errors.

Stand-ins: demo student instead of host login, `?log` instead of the teacher report, offline typed-question fallback instead of the shared LLM call, and `onComplete` instead of the host transition. Power, Rationing and the outer village are outside this branch.
