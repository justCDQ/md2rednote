import { createDeck, createSlide, DEFAULT_LIMITS } from "../core/schema.mjs";
import { getThemeLayoutMetrics } from "../themes/theme-registry.mjs";
import { estimateBlockHeight, estimateSlideUsage } from "./estimate-slide-height.mjs";
import { splitBlock } from "./split-blocks.mjs";

export function blockWeight(block) {
  if (!block) return 0;
  if (block.type === "paragraph" || block.type === "quote" || block.type === "subheading") return block.text.length;
  if (block.type === "bullets" || block.type === "steps") return block.items.join("").length + block.items.length * 12;
  if (block.type === "code") return block.source.length * 1.2;
  if (block.type === "table") return JSON.stringify(block.headers).length + JSON.stringify(block.rows).length;
  if (block.type === "image") return 120;
  return JSON.stringify(block).length;
}

function slideWeight(slide) {
  return slide.blocks.reduce((total, block) => total + blockWeight(block), 0);
}

function hasHeavyBlock(slide) {
  return slide.blocks.some((block) => block.type === "code" || block.type === "table" || block.type === "image");
}

function codeLineCount(block) {
  if (block.type !== "code") return 0;
  return block.source.split("\n").length;
}

function normalizeTitle(title) {
  return title.replace(/^#+\s+/, "").trim();
}

function createFooter(index, total) {
  return `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
}

function finalizeSlides(slides) {
  return slides.map((slide, index) => ({
    ...slide,
    footer: createFooter(index, slides.length),
  }));
}

export function refreshSlideFooters(deck) {
  return {
    ...deck,
    slides: finalizeSlides(deck.slides),
  };
}

function getSlideUsage(slide, context) {
  return estimateSlideUsage(slide, {
    width: context.width,
    height: context.height,
    metrics: context.metrics,
  });
}

function canFitBlock(slide, block, context, { allowExtraBlock = false } = {}) {
  if (!slide) return false;
  const blockLimit = allowExtraBlock ? context.limits.maxBlocksPerSlide + 1 : context.limits.maxBlocksPerSlide;
  if (slide.blocks.length >= blockLimit) return false;

  const currentUsage = getSlideUsage(slide, context);
  const blockHeight = estimateBlockHeight(block, {
    metrics: context.metrics,
    contentWidth: currentUsage.contentWidth,
  });
  const gap = slide.blocks.length > 0 ? context.metrics.contentGap : 0;
  const nextHeight = currentUsage.contentHeight + gap + blockHeight;
  const nextWeight = slideWeight(slide) + blockWeight(block);
  const softWeightBudget = context.limits.maxCharactersPerSlide * (allowExtraBlock ? 1.25 : 1.12);

  return nextHeight <= currentUsage.availableHeight && nextWeight <= softWeightBudget;
}

function canMergeSlides(left, right, context) {
  if (!left || !right) return false;
  if (hasHeavyBlock(left) || hasHeavyBlock(right)) return false;
  const extraTitleBlock = left.title !== right.title ? 1 : 0;
  const combinedBlocks = left.blocks.length + right.blocks.length + extraTitleBlock;
  const combinedWeight = slideWeight(left) + slideWeight(right) + (extraTitleBlock ? right.title.length + 24 : 0);
  const sameSection = left.title === right.title;
  const blockBudget = sameSection ? context.limits.maxBlocksPerSlide + 1 : context.limits.maxBlocksPerSlide;
  const weightBudget = sameSection ? context.limits.maxCharactersPerSlide * 1.25 : context.limits.maxCharactersPerSlide * 1.08;
  if (combinedBlocks > blockBudget || combinedWeight > weightBudget) return false;

  const merged = mergeSlides(left, right);
  return !getSlideUsage(merged, context).hasEstimatedOverflow;
}

function mergeSlides(left, right) {
  const titleBlock =
    left.title !== right.title
      ? [{ type: "paragraph", text: `**${right.title}**` }]
      : [];
  return {
    ...left,
    blocks: [...left.blocks, ...titleBlock, ...right.blocks],
  };
}

function compactSparseSlides(slides, context) {
  const compacted = [];

  for (const slide of slides) {
    const previous = compacted.at(-1);
    const usage = getSlideUsage(slide, context);
    const isSparse = usage.fillRatio < context.metrics.sparseFillRatio && slide.blocks.length <= 2 && slide.type !== "cover";

    if (isSparse && canMergeSlides(previous, slide, context)) {
      compacted[compacted.length - 1] = mergeSlides(previous, slide);
      continue;
    }

    compacted.push(slide);
  }

  const secondPass = [];
  for (let index = 0; index < compacted.length; index += 1) {
    const slide = compacted[index];
    const next = compacted[index + 1];
    const usage = getSlideUsage(slide, context);
    const isSparse = usage.fillRatio < context.metrics.sparseFillRatio && slide.blocks.length <= 2 && slide.type !== "cover";
    if (isSparse && canMergeSlides(slide, next, context)) {
      secondPass.push(mergeSlides(slide, next));
      index += 1;
    } else {
      secondPass.push(slide);
    }
  }

  return secondPass;
}

function rebalanceSparseSlides(slides, context) {
  const output = slides.map((slide) => ({ ...slide, blocks: [...slide.blocks] }));

  for (let index = 0; index < output.length - 1; index += 1) {
    const slide = output[index];
    const next = output[index + 1];
    if (!next || slide.type === "cover" || hasHeavyBlock(slide) || hasHeavyBlock(next)) continue;
    const usage = getSlideUsage(slide, context);
    if (usage.fillRatio >= context.metrics.sparseFillRatio) continue;
    const candidate = next.blocks[0];
    if (!candidate || candidate.type === "code" || candidate.type === "table" || candidate.type === "image") continue;
    if (!canFitBlock(slide, candidate, context, { allowExtraBlock: true })) continue;

    slide.blocks.push(candidate);
    next.blocks.shift();
  }

  return output.filter((slide) => slide.blocks.length > 0);
}

function shouldStartNewSlide(current, nextBlock, context) {
  if (!current) return true;
  if (current.blocks.length === 0) return false;
  if (current.blocks.length >= context.limits.maxBlocksPerSlide) return true;
  if (codeLineCount(nextBlock) > context.limits.maxCodeLinesPerSlide) return true;

  return !canFitBlock(current, nextBlock, context);
}

function sectionKicker(level) {
  if (level <= 2) return "Section";
  if (level === 3) return "Detail";
  return "Note";
}

function shouldContinueWithSubheading(current, currentHeadingLevel, heading, context) {
  if (!current || current.blocks.length === 0) return false;
  if (!currentHeadingLevel || heading.level <= currentHeadingLevel) return false;
  if (current.blocks.length >= Math.max(1, context.limits.maxBlocksPerSlide - 1)) return false;

  const subheading = { type: "subheading", text: normalizeTitle(heading.text), level: heading.level };
  const allowedWeight = context.limits.maxCharactersPerSlide * 0.68;
  return slideWeight(current) + blockWeight(subheading) <= allowedWeight && canFitBlock(current, subheading, context);
}

export function planSlides(document, options = {}) {
  const limits = {
    ...DEFAULT_LIMITS,
    ...(options.limits || {}),
  };
  const context = {
    limits,
    metrics: options.layoutMetrics || getThemeLayoutMetrics(options.theme),
    width: options.width || 1242,
    height: options.height || 1660,
  };
  const slides = [];
  const title = options.title || document.title;
  let current = null;
  let currentTitle = title;
  let currentKicker = "Markdown";
  let currentHeadingLevel = 0;

  const startSlide = ({ kicker, slideTitle, type, headingLevel } = {}) => {
    current = createSlide({
      type,
      kicker: kicker || currentKicker,
      title: slideTitle || currentTitle,
      blocks: [],
    });
    currentHeadingLevel = headingLevel || currentHeadingLevel;
    slides.push(current);
  };

  for (const rawBlock of document.blocks) {
    const blocks = rawBlock.type === "heading" ? [rawBlock] : splitBlock(rawBlock, limits);

    for (const block of blocks) {
    if (block.type === "heading") {
      const headingTitle = normalizeTitle(block.text);
      const headingKicker = sectionKicker(block.level);

      if (shouldContinueWithSubheading(current, currentHeadingLevel, block, context)) {
        current.blocks.push({ type: "subheading", text: headingTitle, level: block.level });
        currentTitle = headingTitle;
        currentKicker = headingKicker;
        currentHeadingLevel = block.level;
        continue;
      }

      currentTitle = headingTitle;
      currentKicker = headingKicker;
      startSlide({
        kicker: block.level === 1 ? "Overview" : currentKicker,
        slideTitle: currentTitle,
        type: block.level === 1 && slides.length === 0 ? "cover" : undefined,
        headingLevel: block.level,
      });
      continue;
    }

    if (!current || shouldStartNewSlide(current, block, context)) {
      startSlide({
        kicker: currentKicker,
        slideTitle: currentTitle,
      });
    }

    current.blocks.push(block);
  }
  }

  if (slides.length === 0) {
    startSlide({ kicker: "Markdown", slideTitle: title, type: "cover" });
  }

  const nonEmptySlides = slides.filter((slide) => slide.blocks.length > 0);
  const compactedSlides = rebalanceSparseSlides(compactSparseSlides(nonEmptySlides, context), context);
  const outputSlides =
    compactedSlides.length > 0
      ? compactedSlides
      : [
          createSlide({
            type: "cover",
            kicker: "Markdown",
            title,
            blocks: [{ type: "paragraph", text: "暂无可生成卡片的内容。" }],
          }),
        ];

  return createDeck({
    title,
    brand: options.brand || title,
    width: options.width,
    height: options.height,
    source: options.source,
    slides: finalizeSlides(outputSlides),
  });
}
