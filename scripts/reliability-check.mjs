import { performance } from "node:perf_hooks";
import { execSync } from "node:child_process";

function runCommand(name, command) {
  const start = performance.now();
  try {
    execSync(command, { stdio: "ignore" });
    const elapsed = Math.round(performance.now() - start);
    return { name, ok: true, elapsed };
  } catch {
    const elapsed = Math.round(performance.now() - start);
    return { name, ok: false, elapsed };
  }
}

const checks = [
  runCommand("lint-backend", "npm run lint"),
  runCommand("audit-root", "npm audit --audit-level=high"),
];

for (const check of checks) {
  console.log(`${check.ok ? "OK" : "FAIL"} ${check.name} (${check.elapsed}ms)`);
}

if (checks.some((check) => !check.ok)) {
  process.exitCode = 1;
}
