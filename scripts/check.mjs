import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseMarkdown } from "../src/markdown/parse-markdown.mjs";
import { planSlides } from "../src/planner/plan-slides.mjs";
import { renderDeckHtml } from "../src/render/render-deck-html.mjs";
import { buildFromMarkdown } from "../src/workflow/build-from-markdown.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const example = path.join(root, "examples/event-loop-mini.md");
const tempOut = path.join(root, ".tmp-check");

const markdown = await readFile(example, "utf8");
const document = parseMarkdown(markdown);
const deck = planSlides(document, {});
const html = renderDeckHtml(deck, {});

if (!deck.slides.length) {
  throw new Error("Expected at least one generated slide.");
}

if (!html.includes("class=\"card")) {
  throw new Error("Expected rendered HTML to contain card markup.");
}

await rm(tempOut, { recursive: true, force: true });
const result = await buildFromMarkdown({
  input: example,
  outDir: tempOut,
  exportImages: false,
});

if (!result.deck.slides.length) {
  throw new Error("Expected build workflow to produce slides.");
}

await rm(tempOut, { recursive: true, force: true });
console.log(`check ok: ${result.deck.slides.length} slides`);
