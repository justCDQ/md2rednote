import { createSlideLayout, estimateLineCount, mergeLayoutMetrics } from "./layout-metrics.mjs";

function textHeight(text, { fontSize, lineHeight, contentWidth, metrics }) {
  return (
    estimateLineCount(text, {
      fontSize,
      contentWidth,
      metrics,
    }) *
    fontSize *
    lineHeight
  );
}

function listItemHeight(item, context) {
  return textHeight(item, {
    ...context,
    fontSize: context.metrics.listFontSize,
    lineHeight: context.metrics.listLineHeight,
  });
}

export function estimateBlockHeight(block, context) {
  const metrics = context.metrics;
  const contentWidth = context.contentWidth;

  if (!block) return 0;

  if (block.type === "subheading") {
    return (
      metrics.subheadingMarginTop +
      textHeight(block.text, {
        fontSize: metrics.subheadingFontSize,
        lineHeight: metrics.subheadingLineHeight,
        contentWidth,
        metrics,
      })
    );
  }

  if (block.type === "paragraph") {
    return textHeight(block.text, {
      fontSize: metrics.bodyFontSize,
      lineHeight: metrics.bodyLineHeight,
      contentWidth,
      metrics,
    });
  }

  if (block.type === "quote") {
    return (
      textHeight(block.text, {
        fontSize: metrics.quoteFontSize,
        lineHeight: metrics.quoteLineHeight,
        contentWidth: contentWidth - 76,
        metrics,
      }) + metrics.quotePaddingY
    );
  }

  if (block.type === "bullets" || block.type === "steps") {
    const items = block.items || [];
    return items.reduce((total, item, index) => {
      const margin = index < items.length - 1 ? metrics.listItemMarginBottom : 0;
      return total + listItemHeight(item, context) + margin;
    }, 0);
  }

  if (block.type === "code") {
    const lines = String(block.source || "").split("\n").length || 1;
    return lines * metrics.codeFontSize * metrics.codeLineHeight + metrics.codePaddingY + metrics.codeLabelHeight;
  }

  if (block.type === "table") {
    const rows = block.rows || [];
    const headerHeight = metrics.tableFontSize * metrics.tableLineHeight + metrics.tableCellPaddingY;
    const columnCount = Math.max(1, block.headers?.length || rows[0]?.length || 1);
    const cellWidth = contentWidth / columnCount;
    const rowHeights = rows.map((row) => {
      const maxCellLines = Math.max(
        1,
        ...row.map((cell) =>
          estimateLineCount(cell, {
            fontSize: metrics.tableFontSize,
            contentWidth: cellWidth,
            metrics,
          }),
        ),
      );
      return maxCellLines * metrics.tableFontSize * metrics.tableLineHeight + metrics.tableCellPaddingY;
    });
    return headerHeight + rowHeights.reduce((total, height) => total + height, 0);
  }

  if (block.type === "image") {
    return metrics.imageMaxHeight + (block.alt ? metrics.imageCaptionHeight : 0);
  }

  if (block.type === "chips") {
    return Math.ceil((block.items || []).length / 3) * 82 + 12;
  }

  if (block.type === "flow") {
    return 150;
  }

  if (block.type === "pipeline") {
    return Math.ceil((block.items || []).length / 4) * 172;
  }

  if (block.type === "roleGrid") {
    return Math.ceil((block.items || []).length / 2) * 300;
  }

  if (block.type === "answer") {
    return 134;
  }

  if (block.type === "html") {
    return 220;
  }

  return textHeight(JSON.stringify(block), {
    fontSize: metrics.bodyFontSize,
    lineHeight: metrics.bodyLineHeight,
    contentWidth,
    metrics,
  });
}

export function estimateSlideUsage(slide, options = {}) {
  const metrics = mergeLayoutMetrics(options.metrics);
  const width = options.width || 1242;
  const height = options.height || 1660;
  const layout = createSlideLayout({ width, height, slide, metrics });
  const blockHeights = (slide.blocks || []).map((block) =>
    estimateBlockHeight(block, {
      metrics,
      contentWidth: layout.contentWidth,
    }),
  );
  const gaps = Math.max(0, blockHeights.length - 1) * metrics.contentGap;
  const contentHeight = blockHeights.reduce((total, item) => total + item, 0) + gaps;

  return {
    ...layout,
    blockHeights,
    contentHeight,
    fillRatio: contentHeight / layout.availableHeight,
    hasEstimatedOverflow: contentHeight > layout.availableHeight,
  };
}
