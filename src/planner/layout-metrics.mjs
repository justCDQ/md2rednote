export const DEFAULT_LAYOUT_METRICS = {
  cardPaddingTop: 82,
  cardPaddingRight: 88,
  cardPaddingBottom: 74,
  cardPaddingLeft: 88,
  toplineHeight: 68,
  mainReservedBottom: 92,
  titleMarginTop: 58,
  titleMarginBottom: 34,
  titleFontSize: 70,
  titleLineHeight: 1.1,
  coverTitleFontSize: 82,
  coverTitleLineHeight: 1.04,
  heroFontSize: 42,
  heroLineHeight: 1.38,
  heroMarginBottom: 50,
  contentGap: 30,
  bodyFontSize: 34,
  bodyLineHeight: 1.62,
  subheadingFontSize: 44,
  subheadingLineHeight: 1.22,
  subheadingMarginTop: 14,
  quoteFontSize: 40,
  quoteLineHeight: 1.48,
  quotePaddingY: 68,
  listFontSize: 34,
  listLineHeight: 1.54,
  listItemMarginBottom: 20,
  codeFontSize: 25,
  codeLineHeight: 1.48,
  codePaddingY: 60,
  codeLabelHeight: 45,
  tableFontSize: 29,
  tableLineHeight: 1.42,
  tableCellPaddingY: 48,
  imageMaxHeight: 580,
  imageCaptionHeight: 66,
  averageLatinCharRatio: 0.52,
  averageCjkCharRatio: 1,
  safetyRatio: 0.9,
  sparseFillRatio: 0.45,
};

export function mergeLayoutMetrics(overrides = {}) {
  return {
    ...DEFAULT_LAYOUT_METRICS,
    ...(overrides || {}),
  };
}

export function getTextWidthRatio(text) {
  const value = String(text || "");
  let units = 0;
  for (const char of value) {
    if (/\s/.test(char)) {
      units += 0.35;
    } else if (/[\u3400-\u9fff\u3000-\u303f\uff00-\uffef]/.test(char)) {
      units += DEFAULT_LAYOUT_METRICS.averageCjkCharRatio;
    } else {
      units += DEFAULT_LAYOUT_METRICS.averageLatinCharRatio;
    }
  }
  return units;
}

export function estimateLineCount(text, { fontSize, contentWidth, metrics }) {
  const usableWidth = Math.max(1, contentWidth);
  const averageCharWidth = fontSize;
  const charsPerLine = Math.max(1, Math.floor(usableWidth / averageCharWidth));
  return Math.max(1, Math.ceil(getTextWidthRatio(text) / charsPerLine));
}

export function createSlideLayout({ width, height, slide, metrics }) {
  const contentWidth = Math.max(1, width - metrics.cardPaddingLeft - metrics.cardPaddingRight);
  const showTitle = !slide?.continuation;
  const titleFontSize = slide?.type === "cover" ? metrics.coverTitleFontSize : metrics.titleFontSize;
  const titleLineHeight = slide?.type === "cover" ? metrics.coverTitleLineHeight : metrics.titleLineHeight;
  const titleLines = showTitle
    ? estimateLineCount(slide?.title || "", {
        fontSize: titleFontSize,
        contentWidth,
        metrics,
      })
    : 0;
  const titleHeight = showTitle ? titleLines * titleFontSize * titleLineHeight : 0;
  const heroHeight = slide?.hero
    ? estimateLineCount(slide.hero, {
        fontSize: metrics.heroFontSize,
        contentWidth,
        metrics,
      }) *
        metrics.heroFontSize *
        metrics.heroLineHeight +
      metrics.heroMarginBottom
    : 0;
  const fixedHeight =
    metrics.cardPaddingTop +
    metrics.cardPaddingBottom +
    metrics.toplineHeight +
    (showTitle ? metrics.titleMarginTop + metrics.titleMarginBottom : metrics.contentGap) +
    titleHeight +
    heroHeight +
    metrics.mainReservedBottom;

  return {
    contentWidth,
    fixedHeight,
    availableHeight: Math.max(1, (height - fixedHeight) * metrics.safetyRatio),
  };
}
