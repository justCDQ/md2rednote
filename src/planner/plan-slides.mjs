import { createDeck, createSlide, DEFAULT_LIMITS } from "../core/schema.mjs";
import { getThemeLayoutMetrics } from "../themes/theme-registry.mjs";
import { estimateBlockHeight, estimateSlideUsage } from "./estimate-slide-height.mjs";
import { splitBlock } from "./split-blocks.mjs";

const DENSITY_PROFILES = {
  loose: {
    safetyRatioDelta: -0.08,
    characterMultiplier: 0.86,
    mergeWeightMultiplier: 1.05,
    sparseFillRatioDelta: 0.05,
  },
  standard: {
    safetyRatioDelta: 0,
    characterMultiplier: 1,
    mergeWeightMultiplier: 1.18,
    sparseFillRatioDelta: 0,
  },
  compact: {
    safetyRatioDelta: 0.08,
    characterMultiplier: 1.24,
    mergeWeightMultiplier: 1.42,
    sparseFillRatioDelta: -0.08,
  },
};

export function blockWeight(block) {
  if (!block) return 0;
  if (block.type === "paragraph" || block.type === "quote" || block.type === "subheading") return block.text.length;
  if (block.type === "bullets" || block.type === "steps") return block.items.join("").length + block.items.length * 12;
  if (block.type === "code") return block.source.length * 1.2;
  if (block.type === "mermaid") return Math.min(240, 120 + block.source.length * 0.35);
  if (block.type === "table") return JSON.stringify(block.headers).length + JSON.stringify(block.rows).length;
  if (block.type === "image") return 120;
  return JSON.stringify(block).length;
}

function slideWeight(slide) {
  return slide.blocks.reduce((total, block) => total + blockWeight(block), 0);
}

function isHeavyBlock(block, context) {
  if (!block) return false;
  if (block.type === "table" || block.type === "image" || block.type === "mermaid") return true;
  return block.type === "code" && codeLineCount(block) > Math.max(10, context.limits.maxCodeLinesPerSlide * 0.55);
}

function hasHeavyBlock(slide, context) {
  return slide.blocks.some((block) => isHeavyBlock(block, context));
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

function canFitBlock(slide, block, context, { allowExtraBlock = false, mode = "soft" } = {}) {
  if (!slide) return false;
  const blockLimit = allowExtraBlock ? context.limits.maxBlocksPerSlide + 1 : context.limits.maxBlocksPerSlide;
  if (mode === "soft" && slide.blocks.length >= blockLimit) return false;

  const currentUsage = getSlideUsage(slide, context);
  const blockHeight = estimateBlockHeight(block, {
    metrics: context.metrics,
    contentWidth: currentUsage.contentWidth,
  });
  const gap = slide.blocks.length > 0 ? context.metrics.contentGap : 0;
  const nextHeight = currentUsage.contentHeight + gap + blockHeight;
  const nextWeight = slideWeight(slide) + blockWeight(block);
  const weightMultiplier = mode === "hard" ? context.density.mergeWeightMultiplier : 1.12;
  const softWeightBudget = context.limits.maxCharactersPerSlide * (allowExtraBlock ? weightMultiplier + 0.18 : weightMultiplier);

  return nextHeight <= currentUsage.availableHeight && nextWeight <= softWeightBudget;
}

function canMergeSlides(left, right, context) {
  if (!left || !right) return false;
  const sameSection = left.title === right.title;
  if (!sameSection) return false;
  const extraTitleBlock = left.title !== right.title ? 1 : 0;
  const combinedBlocks = left.blocks.length + right.blocks.length + extraTitleBlock;
  const combinedWeight = slideWeight(left) + slideWeight(right) + (extraTitleBlock ? right.title.length + 24 : 0);
  const blockBudget = sameSection ? context.limits.maxBlocksPerSlide + 1 : context.limits.maxBlocksPerSlide;
  const weightBudget = context.limits.maxCharactersPerSlide * (sameSection ? context.density.mergeWeightMultiplier : 1.08);
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
    if (!next || slide.type === "cover") continue;
    if (slide.title !== next.title) continue;
    const usage = getSlideUsage(slide, context);
    if (usage.fillRatio >= context.metrics.sparseFillRatio) continue;
    const candidate = next.blocks[0];
    if (!candidate || isHeavyBlock(candidate, context)) continue;
    if (!canFitBlock(slide, candidate, context, { allowExtraBlock: true, mode: "hard" })) continue;

    slide.blocks.push(candidate);
    next.blocks.shift();
  }

  return output.filter((slide) => slide.blocks.length > 0);
}

function isShortOrphanSlide(slide, context) {
  if (!slide || slide.type === "cover" || slide.blocks.length !== 1) return false;
  const block = slide.blocks[0];
  if (isHeavyBlock(block, context)) return false;
  if (block.type === "paragraph" || block.type === "quote" || block.type === "subheading") {
    return block.text.length <= Math.max(48, context.limits.maxCharactersPerSlide * 0.25);
  }
  if (block.type === "bullets" || block.type === "steps") {
    return block.items.length <= 2 && block.items.join("").length <= Math.max(56, context.limits.maxCharactersPerSlide * 0.28);
  }
  if (block.type === "code") return codeLineCount(block) < context.limits.minCodeTailLines;
  return false;
}

function repairOrphanSlides(slides, context) {
  const output = slides.map((slide) => ({ ...slide, blocks: [...slide.blocks] }));

  for (let index = 1; index < output.length; index += 1) {
    const slide = output[index];
    const previous = output[index - 1];
    if (!isShortOrphanSlide(slide, context) || !previous) continue;

    const sameSection = previous.title === slide.title;
    if (!sameSection) continue;
    const candidate =
      slide.blocks[0].type === "subheading"
        ? slide.blocks[0]
        : slide.blocks[0];
    const merged = {
      ...previous,
      blocks: [...previous.blocks, candidate],
    };

    if (!getSlideUsage(merged, context).hasEstimatedOverflow) {
      output[index - 1] = merged;
      slide.blocks = [];
    }
  }

  return output.filter((slide) => slide.blocks.length > 0);
}

function shouldStartNewSlide(current, nextBlock, context) {
  if (!current) return true;
  if (current.blocks.length === 0) return false;
  if (current.blocks.length >= context.limits.maxBlocksPerSlide) return true;
  if (codeLineCount(nextBlock) > context.limits.maxCodeLinesPerSlide) return true;

  return !canFitBlock(current, nextBlock, context, { mode: "soft" });
}

function sectionKicker(level) {
  if (level <= 2) return "Section";
  if (level === 3) return "Detail";
  return "Note";
}

function canAppendSubheading(current, heading, context) {
  if (!current) return false;
  if (current.blocks.length >= context.limits.maxBlocksPerSlide) return false;
  const subheading = { type: "subheading", text: normalizeTitle(heading.text), level: heading.level };
  const allowedWeight = context.limits.maxCharactersPerSlide * 0.68;
  return slideWeight(current) + blockWeight(subheading) <= allowedWeight && canFitBlock(current, subheading, context, { mode: "soft" });
}

function getPrimaryHeadingLevel(document) {
  const contentHeadingLevels = document.blocks
    .filter((block) => block.type === "heading" && block.level > 1)
    .map((block) => block.level);
  return contentHeadingLevels.length > 0 ? Math.min(...contentHeadingLevels) : 1;
}

function splitCodeForSlide(block, context) {
  const lines = String(block.source || "").split("\n");
  const maxLines = Math.max(1, context.limits.maxCodeLinesPerBlock || context.limits.maxCodeLinesPerSlide);
  if (lines.length <= maxLines) return [block];

  let chunkCount = Math.ceil(lines.length / maxLines);
  let chunkSize = Math.ceil(lines.length / chunkCount);
  const tailLines = lines.length % chunkSize;
  if (tailLines > 0 && tailLines < context.limits.minCodeTailLines && chunkCount > 1) {
    chunkSize = Math.ceil(lines.length / (chunkCount - 1));
  }

  const chunks = [];
  for (let index = 0; index < lines.length; index += chunkSize) {
    chunks.push(lines.slice(index, index + chunkSize).join("\n"));
  }

  return chunks.map((source, index) => ({
    ...block,
    source,
    caption: chunks.length > 1 ? `Part ${index + 1}/${chunks.length}` : block.caption,
  }));
}

function splitOversizedFlowBlock(block, slide, context) {
  const isList = block.type === "bullets" || block.type === "steps";
  const isTable = block.type === "table";
  if (!isList && !isTable) return [block];

  const entries = isTable ? block.rows || [] : block.items || [];
  if (entries.length < 2) return [block];

  const emptySlide = slide
    ? { ...slide, type: slide.type === "cover" ? "cover" : undefined, blocks: [] }
    : createSlide({ title: "", blocks: [] });
  const availableHeight = getSlideUsage(emptySlide, context).availableHeight;
  const fullHeight = estimateBlockHeight(block, {
    metrics: context.metrics,
    contentWidth: getSlideUsage(emptySlide, context).contentWidth,
  });

  // Keep a table or list as one semantic block whenever it fits on a fresh page.
  // Fixed row/item limits are only caps for blocks that genuinely need pagination.
  if (fullHeight <= availableHeight) return [block];

  const configuredLimit = isTable
    ? context.limits.maxTableRowsPerBlock
    : context.limits.maxListItemsPerBlock;
  const maxEntries = Math.max(1, Number(configuredLimit) || entries.length);
  const baseStart = Number(block.start) || 1;
  const chunks = [];
  let entryIndex = 0;

  while (entryIndex < entries.length) {
    const chunkStart = entryIndex;
    const chunk = [];

    while (entryIndex < entries.length && chunk.length < maxEntries) {
      const candidateEntries = [...chunk, entries[entryIndex]];
      const candidate = isTable
        ? { ...block, rows: candidateEntries }
        : {
            ...block,
            items: candidateEntries,
            ...(block.type === "steps" && baseStart + chunkStart > 1
              ? { start: baseStart + chunkStart }
              : {}),
          };
      const candidateHeight = estimateBlockHeight(candidate, {
        metrics: context.metrics,
        contentWidth: getSlideUsage(emptySlide, context).contentWidth,
      });

      if (chunk.length > 0 && candidateHeight > availableHeight) break;
      chunk.push(entries[entryIndex]);
      entryIndex += 1;
      if (candidateHeight > availableHeight) break;
    }

    chunks.push(
      isTable
        ? { ...block, rows: chunk }
        : {
            ...block,
            items: chunk,
            ...(block.type === "steps" && baseStart + chunkStart > 1
              ? { start: baseStart + chunkStart }
              : {}),
          },
    );
  }

  return chunks;
}

function normalizeLimits(inputLimits) {
  const profile = DENSITY_PROFILES[inputLimits.densityProfile] || DENSITY_PROFILES.standard;
  const maxCharactersPerSlide = Math.max(120, Math.round(inputLimits.maxCharactersPerSlide * profile.characterMultiplier));
  return {
    ...inputLimits,
    maxCharactersPerSlide,
    maxParagraphCharacters:
      inputLimits.maxParagraphCharacters === DEFAULT_LIMITS.maxParagraphCharacters
        ? Math.max(80, Math.round(maxCharactersPerSlide * 0.45))
        : inputLimits.maxParagraphCharacters,
    maxQuoteCharacters:
      inputLimits.maxQuoteCharacters === DEFAULT_LIMITS.maxQuoteCharacters
        ? Math.max(70, Math.round(maxCharactersPerSlide * 0.36))
        : inputLimits.maxQuoteCharacters,
    maxListItemsPerBlock:
      inputLimits.maxListItemsPerBlock === DEFAULT_LIMITS.maxListItemsPerBlock
        ? Math.max(2, Math.min(8, inputLimits.maxBlocksPerSlide + (inputLimits.densityProfile === "compact" ? 2 : 1)))
        : inputLimits.maxListItemsPerBlock,
  };
}

function applyDensityToMetrics(metrics, limits) {
  const profile = DENSITY_PROFILES[limits.densityProfile] || DENSITY_PROFILES.standard;
  return {
    ...metrics,
    safetyRatio: Math.max(0.72, Math.min(0.98, metrics.safetyRatio + profile.safetyRatioDelta)),
    sparseFillRatio: Math.max(0.25, Math.min(0.72, limits.minFillRatio + profile.sparseFillRatioDelta)),
  };
}

export function planSlides(document, options = {}) {
  const rawLimits = {
    ...DEFAULT_LIMITS,
    ...(options.limits || {}),
  };
  const limits = normalizeLimits(rawLimits);
  const density = DENSITY_PROFILES[rawLimits.densityProfile] || DENSITY_PROFILES.standard;
  const context = {
    limits,
    density,
    metrics: applyDensityToMetrics(options.layoutMetrics || getThemeLayoutMetrics(options.theme), limits),
    width: options.width || 1242,
    height: options.height || 1660,
  };
  const slides = [];
  const title = options.title || document.title;
  const primaryHeadingLevel = getPrimaryHeadingLevel(document);
  let current = null;
  let currentTitle = title;
  let currentKicker = "Markdown";

  const startSlide = ({ kicker, slideTitle, type, continuation = false } = {}) => {
    current = createSlide({
      type,
      kicker: kicker || currentKicker,
      title: slideTitle || currentTitle,
      continuation,
      blocks: [],
    });
    slides.push(current);
  };

  for (const rawBlock of document.blocks) {
    const normalizedBlocks = rawBlock.type === "heading" ? [rawBlock] : splitBlock(rawBlock, limits);
    const layoutSlide = current || createSlide({ kicker: currentKicker, title: currentTitle, blocks: [] });
    const blocks = normalizedBlocks.flatMap((block) => splitOversizedFlowBlock(block, layoutSlide, context));

    for (const block of blocks) {
    if (block.type === "heading") {
      const headingTitle = normalizeTitle(block.text);
      const headingKicker = sectionKicker(block.level);
      const isSubheading = block.level > primaryHeadingLevel;

      if (isSubheading) {
        currentKicker = headingKicker;
        if (!canAppendSubheading(current, block, context)) {
          startSlide({ kicker: currentKicker, slideTitle: currentTitle, continuation: true });
        }
        current.blocks.push({ type: "subheading", text: headingTitle, level: block.level });
        continue;
      }

      currentTitle = headingTitle;
      currentKicker = headingKicker;
      startSlide({
        kicker: block.level === 1 ? "Overview" : currentKicker,
        slideTitle: currentTitle,
        type: block.level === 1 && slides.length === 0 ? "cover" : undefined,
      });
      continue;
    }

    if (!current || shouldStartNewSlide(current, block, context)) {
      startSlide({
        kicker: currentKicker,
        slideTitle: currentTitle,
        continuation: Boolean(current),
      });
    }

    if (
      block.type === "code" &&
      current.blocks.length === 0 &&
      !canFitBlock(current, block, context, { mode: "hard", allowExtraBlock: true })
    ) {
      const codeParts = splitCodeForSlide(block, context);
      for (const part of codeParts) {
        if (current.blocks.length > 0 && shouldStartNewSlide(current, part, context)) {
          startSlide({ kicker: currentKicker, slideTitle: currentTitle, continuation: true });
        }
        current.blocks.push(part);
      }
    } else {
      current.blocks.push(block);
    }
  }
  }

  if (slides.length === 0) {
    startSlide({ kicker: "Markdown", slideTitle: title, type: "cover" });
  }

  const nonEmptySlides = slides.filter((slide) => slide.blocks.length > 0);
  const compactedSlides = repairOrphanSlides(rebalanceSparseSlides(compactSparseSlides(nonEmptySlides, context), context), context);
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
