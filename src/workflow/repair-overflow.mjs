import { createSlide } from "../core/schema.mjs";
import { refreshSlideFooters } from "../planner/plan-slides.mjs";

function splitText(text) {
  const value = String(text || "").trim();
  if (value.length < 80) return null;
  const middle = Math.floor(value.length / 2);
  const punctuationIndex = value.slice(0, middle + 40).lastIndexOf("。");
  const splitAt = punctuationIndex > 40 ? punctuationIndex + 1 : middle;
  return [value.slice(0, splitAt).trim(), value.slice(splitAt).trim()].filter(Boolean);
}

function splitItems(items) {
  if (!Array.isArray(items) || items.length < 2) return null;
  const middle = Math.ceil(items.length / 2);
  return [items.slice(0, middle), items.slice(middle)].filter((part) => part.length);
}

function splitCode(source) {
  const lines = String(source || "").split("\n");
  if (lines.length < 8) return null;
  const middle = Math.ceil(lines.length / 2);
  return [lines.slice(0, middle).join("\n"), lines.slice(middle).join("\n")].filter(Boolean);
}

function splitTable(block) {
  if (!Array.isArray(block.rows) || block.rows.length < 2) return null;
  const middle = Math.ceil(block.rows.length / 2);
  return [block.rows.slice(0, middle), block.rows.slice(middle)].filter((part) => part.length);
}

function splitBlock(block) {
  if (block.type === "paragraph" || block.type === "quote") {
    const parts = splitText(block.text);
    return parts?.length === 2 ? parts.map((text) => ({ ...block, text })) : null;
  }

  if (block.type === "bullets" || block.type === "steps") {
    const parts = splitItems(block.items);
    return parts?.length === 2 ? parts.map((items) => ({ ...block, items })) : null;
  }

  if (block.type === "code") {
    const parts = splitCode(block.source);
    return parts?.length === 2
      ? parts.map((source, index) => ({
          ...block,
          source,
          caption: block.caption || `Part ${index + 1}/2`,
        }))
      : null;
  }

  if (block.type === "table") {
    const parts = splitTable(block);
    return parts?.length === 2 ? parts.map((rows) => ({ ...block, rows })) : null;
  }

  return null;
}

function blockRepairScore(block) {
  if (block.type === "code") return String(block.source || "").split("\n").length * 80;
  if (block.type === "table") return (block.rows || []).length * 90;
  if (block.type === "bullets" || block.type === "steps") return (block.items || []).join("").length + block.items.length * 40;
  if (block.type === "paragraph" || block.type === "quote") return String(block.text || "").length;
  return 0;
}

function ensureNextSlide(slides, index, slide) {
  if (slides[index + 1]) return slides[index + 1];
  const next = createSlide({
    kicker: slide.kicker,
    title: slide.title,
    blocks: [],
  });
  slides.splice(index + 1, 0, next);
  return next;
}

export function repairOverflowPages(deck, overflowReport = []) {
  const overflowIndexes = new Set(overflowReport.filter((item) => item.hasOverflow).map((item) => item.index - 1));
  if (!overflowIndexes.size) return deck;

  const slides = deck.slides.map((slide) => ({ ...slide, blocks: [...(slide.blocks || [])] }));

  for (const index of overflowIndexes) {
    const slide = slides[index];
    if (!slide?.blocks?.length) continue;

    const candidates = slide.blocks
      .map((block, blockIndex) => ({ block, blockIndex, score: blockRepairScore(block), parts: splitBlock(block) }))
      .filter((candidate) => candidate.parts?.length === 2)
      .sort((left, right) => right.score - left.score);

    if (candidates.length) {
      const { blockIndex, parts } = candidates[0];
      const next = ensureNextSlide(slides, index, slide);
      slide.blocks.splice(blockIndex, 1, parts[0]);
      next.blocks.unshift(parts[1]);
      continue;
    }

    if (slide.blocks.length > 1) {
      const moved = slide.blocks.pop();
      ensureNextSlide(slides, index, slide).blocks.unshift(moved);
    }
  }

  return refreshSlideFooters({
    ...deck,
    slides: slides.filter((slide) => slide.blocks.length > 0),
  });
}
