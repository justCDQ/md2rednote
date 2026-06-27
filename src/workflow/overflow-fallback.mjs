import { writeFile } from "node:fs/promises";
import { planSlides } from "../planner/plan-slides.mjs";
import { renderDeckHtml } from "../render/render-deck-html.mjs";
import { measureHtmlOverflow } from "../export/export-png-cards.mjs";

function tightenLimits(limits) {
  return {
    ...limits,
    maxBlocksPerSlide: Math.max(1, Math.floor(limits.maxBlocksPerSlide * 0.8)),
    maxCharactersPerSlide: Math.max(120, Math.floor(limits.maxCharactersPerSlide * 0.72)),
    maxCodeLinesPerSlide: Math.max(6, Math.floor(limits.maxCodeLinesPerSlide * 0.75)),
    maxParagraphCharacters: Math.max(70, Math.floor(limits.maxParagraphCharacters * 0.75)),
    maxQuoteCharacters: Math.max(60, Math.floor(limits.maxQuoteCharacters * 0.75)),
    maxListItemsPerBlock: Math.max(2, Math.floor(limits.maxListItemsPerBlock * 0.8)),
    maxCodeLinesPerBlock: Math.max(6, Math.floor(limits.maxCodeLinesPerBlock * 0.75)),
    maxTableRowsPerBlock: Math.max(2, Math.floor(limits.maxTableRowsPerBlock * 0.8)),
  };
}

function hasOverflow(report) {
  return report.some((item) => item.hasOverflow);
}

export async function buildDeckWithOverflowFallback({
  document,
  deckOptions,
  initialLimits,
  theme,
  htmlPath,
  chromePath,
  maxAttempts = 3,
}) {
  let limits = { ...initialLimits };
  let last = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const deck = planSlides(document, {
      ...deckOptions,
      limits,
    });
    const html = renderDeckHtml(deck, { theme });
    await writeFile(htmlPath, html, "utf8");

    const overflowReport = await measureHtmlOverflow({ htmlPath, deck, chromePath });
    last = {
      deck,
      html,
      limits,
      overflowReport,
      attempts: attempt,
    };

    if (!hasOverflow(overflowReport)) return last;
    limits = tightenLimits(limits);
  }

  return last;
}
