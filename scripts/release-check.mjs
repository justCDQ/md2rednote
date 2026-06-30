import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { readFile } from "node:fs/promises";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const version = packageJson.version;

function run(command, args) {
  console.log(`\n$ ${[command, ...args].join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

run("npm", ["run", "check"]);
run("bun", ["build", "apps/local/server.ts", "--target=bun", "--outfile", "/tmp/xhs-cardgen-server-check.js"]);
run("npm", ["run", "local:build"]);

const expectedFiles = [
  path.join(root, "dist-local", `md2rednote-v${version}-macos-arm64.zip`),
  path.join(root, "dist-local", `md2rednote-v${version}-windows-x64.zip`),
];

for (const file of expectedFiles) {
  if (!existsSync(file)) {
    console.error(`Missing release artifact: ${file}`);
    process.exit(1);
  }
}

console.log(`\nrelease check ok: v${version}`);
for (const file of expectedFiles) console.log(`- ${file}`);
