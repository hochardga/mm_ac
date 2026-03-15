import { spawnSync } from "node:child_process";
import path from "node:path";

test("db:seed succeeds from the CLI entrypoint", () => {
  const result = spawnSync("pnpm", ["db:seed"], {
    cwd: path.join(import.meta.dirname, "..", ".."),
    encoding: "utf8",
    env: {
      ...process.env,
      NODE_ENV: "test",
    },
  });

  expect(result.status).toBe(0);
  expect(result.stdout).toContain("Seeded 4 published cases.");
});
