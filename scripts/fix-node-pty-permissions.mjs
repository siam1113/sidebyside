// On some machines, npm's tarball extraction drops the executable bit on
// node-pty's prebuilt native helper binaries. When that happens, node-pty
// fails every spawn with a generic "posix_spawnp failed." error that has
// nothing to do with the command being spawned. This restores +x so the
// sandbox's PTY bridge works right after `npm install`.
import { chmodSync, existsSync } from "node:fs";
import path from "node:path";

const prebuildsDir = path.join(process.cwd(), "node_modules", "node-pty", "prebuilds");
const targets = [
  "darwin-arm64/spawn-helper",
  "darwin-arm64/pty.node",
  "darwin-x64/spawn-helper",
  "darwin-x64/pty.node",
];

for (const relPath of targets) {
  const fullPath = path.join(prebuildsDir, relPath);
  if (existsSync(fullPath)) {
    chmodSync(fullPath, 0o755);
  }
}
