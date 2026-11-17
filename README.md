# Rebuild — Clean Water standalone level

See [PROJECT.md](PROJECT.md) for requirements, approved scope overrides, ownership and testing.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173/?demo to play the complete Clean Water level. See [MODULE_WATER.md](MODULE_WATER.md) for the host-game integration contract.

```sh
npm run build
npm test
npx playwright install chromium
npm run smoke
```

Normal colours, direct Level 1 entry, no login or outer village. Work is pushed only to `seat-a/foundation`, never `main`.
