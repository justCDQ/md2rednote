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

另一句短说明。

第三句短说明。
`;
const sparseDeck = planSlides(parseMarkdown(sparseMarkdown), {
  limits: { maxBlocksPerSlide: 1, maxCharactersPerSlide: 220 },
});
if (sparseDeck.slides.length > 2) {
  throw new Error("Expected sparse slides within the same heading to be compacted.");
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

const densityMarkdown = `## 密度测试

${Array.from({ length: 8 }, (_, index) => `这是第 ${index + 1} 段用于测试分页参数是否生效的内容，文字不长但需要能够被合并。`).join("\n\n")}
`;
const lowDensityDeck = planSlides(parseMarkdown(densityMarkdown), {
  limits: { maxCharactersPerSlide: 180, maxBlocksPerSlide: 2, densityProfile: "loose" },
});
const highDensityDeck = planSlides(parseMarkdown(densityMarkdown), {
  limits: { maxCharactersPerSlide: 520, maxBlocksPerSlide: 6, densityProfile: "compact" },
});
if (highDensityDeck.slides.length > lowDensityDeck.slides.length) {
  throw new Error("Increasing density controls should not create more slides.");
}

const codeTailMarkdown = `## 代码尾部

前面有一段解释，后面跟一个短代码块。

\`\`\`js
console.log("one");
console.log("two");
\`\`\`
`;
const codeTailDeck = planSlides(parseMarkdown(codeTailMarkdown), {
  limits: { maxCharactersPerSlide: 520, maxBlocksPerSlide: 4, codeSplitStrategy: "avoid" },
});
if (codeTailDeck.slides.some((slide) => slide.blocks.length === 1 && slide.blocks[0].type === "code" && slide.blocks[0].source.split("\n").length < 4)) {
  throw new Error("Short code tails should not become isolated slides.");
}

const orphanMarkdown = `## 同一标题

${"这是一段主体内容，用于占据页面但仍保留少量空间。".repeat(18)}

孤儿行。
`;
const orphanDeck = planSlides(parseMarkdown(orphanMarkdown), {
  limits: { maxCharactersPerSlide: 520, maxBlocksPerSlide: 5, densityProfile: "compact" },
});
if (orphanDeck.slides.some((slide) => slide.blocks.length === 1 && slide.blocks[0].type === "paragraph" && slide.blocks[0].text === "孤儿行。")) {
  throw new Error("One-line orphan slides should be merged back when space allows.");
}

const sectionBoundaryMarkdown = `## 上一节标题

这是一段上一节的简短内容，页面还有空间。

## 新标题

这段内容属于新标题，不能被单独移动到上一节下面。

\`\`\`js
console.log("keep section boundary");
console.log("with code block");
\`\`\`
`;
const sectionBoundaryDeck = planSlides(parseMarkdown(sectionBoundaryMarkdown), {
  limits: { maxCharactersPerSlide: 620, maxBlocksPerSlide: 4, densityProfile: "compact" },
});
const previousSectionSlide = sectionBoundaryDeck.slides.find((slide) => slide.title === "上一节标题");
if (previousSectionSlide?.blocks.some((block) => block.type === "paragraph" && block.text.includes("这段内容属于新标题"))) {
  throw new Error("Content from a new heading must not be moved under the previous slide title.");
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
