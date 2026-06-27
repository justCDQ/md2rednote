import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_LIMITS } from "../core/schema.mjs";
import { parseMarkdown } from "../markdown/parse-markdown.mjs";
import { planSlides } from "../planner/plan-slides.mjs";
import { renderDeckHtml } from "../render/render-deck-html.mjs";
import { exportPngCards } from "../export/export-png-cards.mjs";
import { buildDeckWithOverflowFallback } from "./overflow-fallback.mjs";

export async function buildFromMarkdown({
  input,
  outDir,
  title,
  brand,
  theme,
  exportImages = true,
  chromePath,
  filePrefix = "card",
  limits,
  overflowFallback = true,
  maxOverflowAttempts = 3,
}) {
  const markdown = await readFile(input, "utf8");
  const document = parseMarkdown(markdown);
  await mkdir(outDir, { recursive: true });

  const slidesPath = path.join(outDir, "slides.json");
  const htmlPath = path.join(outDir, "preview.html");
  const deckOptions = {
    title,
    brand,
    source: input,
  };
  const initialLimits = {
    ...DEFAULT_LIMITS,
    ...(limits || {}),
  };
  let deck;
  let html;
  let overflowReport = null;
  let overflowAttempts = 0;

  if (exportImages && overflowFallback) {
    const result = await buildDeckWithOverflowFallback({
      document,
      deckOptions,
      initialLimits,
      theme,
      htmlPath,
      chromePath,
      maxAttempts: maxOverflowAttempts,
    });
    deck = result.deck;
    html = result.html;
    overflowReport = result.overflowReport;
    overflowAttempts = result.attempts;
  } else {
    deck = planSlides(document, {
      ...deckOptions,
      limits: initialLimits,
    });
    html = renderDeckHtml(deck, { theme });
    await writeFile(htmlPath, html, "utf8");
  }

  await writeFile(slidesPath, `${JSON.stringify(deck, null, 2)}\n`, "utf8");
  await writeFile(htmlPath, html, "utf8");

  let exportResult = null;
  if (exportImages) {
    exportResult = await exportPngCards({
      htmlPath,
      outDir: path.join(outDir, "cards"),
      deck,
      chromePath,
      filePrefix,
    });
    exportResult.overflowReport = overflowReport || exportResult.overflowReport;
    exportResult.overflowAttempts = overflowAttempts;
  }

  return {
    deck,
    slidesPath,
    htmlPath,
    exportResult,
  };
}
