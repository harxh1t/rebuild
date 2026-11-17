import { createServer } from "vite";
import { spawn } from "node:child_process";

// Own the server directly: avoids orphaned npm/cmd children during Windows teardown.
const server = await createServer({ server: { port: 5173, strictPort: true } });
try {
  await server.listen();
  const child = spawn(
    process.execPath,
    ["node_modules/@playwright/test/cli.js", "test"],
    {
      stdio: "inherit",
      env: { ...process.env, REBUILD_SMOKE_SERVER: "1" },
    },
  );
  process.exitCode = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
} finally {
  await server.close();
}
