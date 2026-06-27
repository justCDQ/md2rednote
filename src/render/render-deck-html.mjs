import { escapeHtml, inlineMarkdown } from "./escape-html.mjs";
import { renderBlock } from "./block-renderers.mjs";
import { getTheme } from "../themes/theme-registry.mjs";

export function renderSlide(slide, brand) {
  return `
    <article class="card ${slide.type || ""}">
      <div class="topline"><span>${inlineMarkdown(slide.kicker)}</span><span>${inlineMarkdown(slide.footer)}</span></div>
      <main>
        <h1>${inlineMarkdown(slide.title)}</h1>
        ${slide.hero ? `<p class="hero">${inlineMarkdown(slide.hero)}</p>` : ""}
        <div class="content">${slide.blocks.map(renderBlock).join("\n")}</div>
      </main>
      <div class="mark">${inlineMarkdown(brand)}</div>
    </article>
  `;
}

function renderHtmlShell({ title, css, bodyClass = "", body }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title || "XHS Cards")}</title>
  <style>${css}</style>
</head>
<body${bodyClass ? ` class="${escapeHtml(bodyClass)}"` : ""}>
  ${body}
</body>
</html>`;
}

export function renderDeckHtml(deck, options = {}) {
  const themeName = options.theme || "warm-tech";
  const theme = getTheme(themeName);

  const width = deck.width || 1242;
  const height = deck.height || 1660;
  const brand = deck.brand || deck.title || "";

  return renderHtmlShell({
    title: deck.title,
    css: theme.render({ width, height }),
    body: `<div class="stage">
    ${deck.slides.map((slide) => renderSlide(slide, brand)).join("\n")}
  </div>`,
  });
}

export function renderSingleSlideHtml(deck, slide, options = {}) {
  const themeName = options.theme || "warm-tech";
  const theme = getTheme(themeName);

  const width = deck.width || 1242;
  const height = deck.height || 1660;
  const brand = deck.brand || deck.title || "";
  const singleSlideCss = `
    body.single-card {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      background: transparent;
    }
    body.single-card .stage {
      display: block;
      width: ${width}px;
      height: ${height}px;
      padding: 0;
    }
  `;

  return renderHtmlShell({
    title: slide.title || deck.title,
    css: `${theme.render({ width, height })}\n${singleSlideCss}`,
    bodyClass: "single-card",
    body: `<div class="stage">${renderSlide(slide, brand)}</div>`,
  });
}
