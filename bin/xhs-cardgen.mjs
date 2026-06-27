#!/usr/bin/env node
import path from "node:path";
import { buildFromMarkdown } from "../src/workflow/build-from-markdown.mjs";
import { buildTyporaMarkdown } from "../src/adapters/typora/build-typora.mjs";

const DEFAULT_CHROME_MAC = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function printHelp() {
  console.log(`md2rednote

Usage:
  md2rednote build <input.md> [options]
  md2rednote typora <input.md> [options]

Options:
  --out <dir>          Output directory. Default: ./dist/<input-name>
  --title <title>      Override deck title.
  --brand <brand>      Footer brand text. Default: title.
  --theme <name>       Theme name. Default: warm-tech.
  --chrome <path>      Chrome/Chromium executable path.
  --max-chars <n>      Max weighted characters per card. Default: 360.
  --max-blocks <n>     Max content blocks per card. Default: 4.
  --attempts <n>       Max overflow fallback attempts. Default: 3.
  --no-images          Generate slides.json and preview.html only.
  --no-fallback        Disable overflow-aware replanning.
  --help               Show this help.

Examples:
  md2rednote build ./article.md --out ./dist/article
  md2rednote build ./article.md --no-images
  md2rednote typora ~/Desktop/article.markdown --out ./dist/article
`);
}

function readOption(args, name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  return args[index + 1] || fallback;
}

function hasFlag(args, name) {
  return args.includes(name);
}

function readNumberOption(args, name, fallback) {
  const raw = readOption(args, name);
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }
  return value;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || hasFlag(args, "--help") || command === "help") {
    printHelp();
    return;
  }

  if (command !== "build" && command !== "typora") {
    throw new Error(`Unknown command: ${command}`);
  }

  const input = args[1];
  if (!input) {
    throw new Error("Missing input Markdown file.");
  }

  const resolvedInput = path.resolve(input);
  const inputName = path.basename(input, path.extname(input));
  const outDir = path.resolve(readOption(args, "--out", path.join("dist", inputName)));
  const noImages = hasFlag(args, "--no-images");
  const chromePath = readOption(args, "--chrome", process.platform === "darwin" ? DEFAULT_CHROME_MAC : undefined);
  const limits = {
    ...(readNumberOption(args, "--max-chars") ? { maxCharactersPerSlide: readNumberOption(args, "--max-chars") } : {}),
    ...(readNumberOption(args, "--max-blocks") ? { maxBlocksPerSlide: readNumberOption(args, "--max-blocks") } : {}),
  };
  const sharedOptions = {
    input: resolvedInput,
    outDir,
    title: readOption(args, "--title"),
    brand: readOption(args, "--brand"),
    theme: readOption(args, "--theme", "warm-tech"),
    chromePath,
    exportImages: !noImages,
    limits,
    overflowFallback: !hasFlag(args, "--no-fallback"),
    maxOverflowAttempts: readNumberOption(args, "--attempts", 3),
  };

  const result =
    command === "typora"
      ? await buildTyporaMarkdown(sharedOptions)
      : await buildFromMarkdown(sharedOptions);

  console.log(`Created ${result.deck.slides.length} slides`);
  console.log(`Slides JSON: ${result.slidesPath}`);
  console.log(`Preview HTML: ${result.htmlPath}`);

  if (result.exportResult) {
    const overflow = result.exportResult.overflowReport.filter((item) => item.hasOverflow);
    console.log(`PNG cards: ${result.exportResult.files.length}`);
    if (overflow.length > 0) {
      console.warn(`Warning: ${overflow.length} card(s) may overflow: ${overflow.map((item) => item.index).join(", ")}`);
    }
  }

  if (result.adapter) {
    console.log(`Adapter: ${result.adapter.name}`);
    console.log(`Adapter manifest: ${result.adapter.manifestPath}`);
    console.log(`Copied assets: ${result.adapter.copiedAssets.length}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
