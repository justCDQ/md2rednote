import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseMarkdown } from "../src/markdown/parse-markdown.mjs";
import { planSlides } from "../src/planner/plan-slides.mjs";
import { estimateSlideUsage } from "../src/planner/estimate-slide-height.mjs";
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

const nestedHeadingMarkdown = `## 第二部分：tj/co 源码逐段剖析

tj/co 的核心文件 \`index.js\` 总共两百多行，有两个主要差异。

#### 入口：co 函数本身

\`\`\`js
function co(gen) {
  return new Promise(function(resolve) {
    resolve(gen);
  });
}
\`\`\`
`;
const nestedDeck = planSlides(parseMarkdown(nestedHeadingMarkdown), {});
const firstNestedSlide = nestedDeck.slides[0];
if (nestedDeck.slides.length !== 1) {
  throw new Error("Expected sparse parent heading and first child heading to share one slide.");
}
if (!firstNestedSlide.blocks.some((block) => block.type === "subheading" && block.text.includes("入口：co 函数本身"))) {
  throw new Error("Expected continued child heading to be rendered as a block on the parent slide.");
}
if ("headingLevel" in firstNestedSlide) {
  throw new Error("Planner internal heading metadata must not leak into slides.json.");
}

const sparseMarkdown = `## A

一句短说明。

## B

另一句短说明。

## C

第三句短说明。
`;
const sparseDeck = planSlides(parseMarkdown(sparseMarkdown), {});
if (sparseDeck.slides.length > 2) {
  throw new Error("Expected sparse neighboring sections to be compacted.");
}

const longContentMarkdown = `## 长内容

${"这是一段用于测试高度预算分页的中文内容。".repeat(60)}

\`\`\`js
${Array.from({ length: 16 }, (_, index) => `console.log("line ${index + 1}");`).join("\n")}
\`\`\`
`;
const longDeck = planSlides(parseMarkdown(longContentMarkdown), {});
if (longDeck.slides.some((slide) => !slide.blocks.length)) {
  throw new Error("Generated deck must not contain empty slides.");
}
if (longDeck.slides.some((slide) => estimateSlideUsage(slide, {}).fillRatio > 1.18)) {
  throw new Error("Height budget should avoid obviously overfull slides.");
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
