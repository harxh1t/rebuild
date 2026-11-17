# Clean Water — merge contract

## Entry and exit

Import `mountWater(root, canvas, options)` from `src/modules/water/entry.ts`. It opens directly inside Level 1, with no login or outer village. `options.studentCode` defaults to demo student `S00`; `options.storage` defaults to `localStorage`; `options.onComplete(summary)` is the host-game exit hook. The returned function disposes the renderer, animation, events and audio.

The standalone route is `/`. Useful shortcuts are `?jump=water.collect`, `water.settle`, `water.filter`, `water.safe`, `water.boil`, `water.deliver`, or `water.quiz`; `?debug`; `?log`; `?lab=water_house`; and `?reset`.

## Level sequence

1. `water.collect` — collect muddy water.
2. `water.settle` — predict, choose confidence, and hold to settle.
3. `water.filter` — build cotton → activated charcoal → fine sand → coarse sand → pebbles, bottom to top; pour and retry.
4. `water.safe` — discover that clear water may still contain germs.
5. `water.boil` — predict whether the homemade filter removes germs; add wood, strike, fan, boil and cool.
6. `water.deliver` — carry cooled treated water to the child.
7. `water.quiz.*` — four reusable Check-up questions, including one transfer question.
8. Application cards, then the Module 1 completion screen.

## Learning data

Events are stored under `rebuild.events.v1`. Fields: `id`, `time`, `type`, `studentCode`, `puzzleId`, `correct`, `confidence`, `misconception`, optional `answer`, `runId`, `concept`, and `transfer`. Water uses `clear_means_safe`, `filtering_kills_germs`, `filter_layer_order`, `filter_support_missing`, `filter_carbon_missing`, `mud_floats`, and `settling_no_change`. Quiz events use type `quiz`; the transfer question has `transfer: true`.

Per-student resumable progress is stored under `rebuild.water.v1.<studentCode>`. `?reset` clears standalone progress and learning events.

## Reusable content

`content.ts` contains puzzle copy, three offline Ask Rio chips per stage, four quiz questions and three application cards. A new module supplies the same shapes: question/options/explanation/transfer metadata; three short chip answers per puzzle; and application-card icon/title/line data. `answerRioTyped(question, step)` is the hidden offline typed-question fallback; Seat C may replace this function with the shared LLM integration later.

## Visuals and science

The plant is procedural Three.js geometry inspired by `docs/ref/water_house*.jpg`: lime plaster, timber frame, terracotta tiles, raised barrel tank, pipes, filter basins, well and pots. Every mesh material comes from `src/scene/palette.ts`. There are no textures or downloaded models.

Boiling uses accelerated game time and labels 100°C as an illustrative sea-level value. The Notebook gives the full guidance: an adult brings water to a rolling boil for one minute, or three minutes above 2,000 m, then cools and stores it covered. The illustrated germ view explicitly says an ordinary magnifying glass cannot show germs.

## Stand-ins and boundaries

- Demo student `S00` stands in for Seat B login.
- `?log` stands in for Seat C teacher reporting.
- Offline chips and `answerRioTyped` stand in for the future shared Ask Rio service.
- The completion callback stands in for the host game's transition after Level 1.
- No outer village, other landmarks, grey state or completion recolouring is included, by user instruction.
- The Water module is complete; Power and Rationing are outside this branch.

## Verification

Run `npm run build`, `npm test`, and `npm run smoke`. Smoke plays the complete module with two confident misconceptions, a filter failure and retry, an empty-hearth failure, all four quiz questions, application cards and completion. It also fails on console errors and confirms the plant stays below 200 draw calls.
