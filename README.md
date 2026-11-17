# Rebuild — standalone foundation

See [PROJECT.md](PROJECT.md) for requirements, approved scope overrides, ownership and testing.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173/?demo or http://127.0.0.1:5173/?demo&jump=sample.

```sh
npm run build
npm test
npx playwright install chromium
npm run smoke
```

Normal colours, separate level view, sample puzzle only. No push until user approval.
