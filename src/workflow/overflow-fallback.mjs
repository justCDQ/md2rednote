import { writeFile } from "node:fs/promises";
import { planSlides } from "../planner/plan-slides.mjs";
import { renderDeckHtml } from "../render/render-deck-html.mjs";
import { measureHtmlOverflow } from "../export/export-png-cards.mjs";
import { repairOverflowPages } from "./repair-overflow.mjs";

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
  const limits = { ...initialLimits };
  let deck = planSlides(document, {
    ...deckOptions,
    limits,
    theme,
  });
  let last = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
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
    deck = repairOverflowPages(deck, overflowReport);
  }

  return last;
}
