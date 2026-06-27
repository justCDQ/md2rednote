import { escapeHtml, inlineMarkdown } from "./escape-html.mjs";
import { renderBlock } from "./block-renderers.mjs";
import { getTheme } from "../themes/theme-registry.mjs";

function renderSlide(slide, brand) {
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

export function renderDeckHtml(deck, options = {}) {
  const themeName = options.theme || "warm-tech";
  const theme = getTheme(themeName);

  const width = deck.width || 1242;
  const height = deck.height || 1660;
  const brand = deck.brand || deck.title || "";

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(deck.title || "XHS Cards")}</title>
  <style>${theme.render({ width, height })}</style>
</head>
<body>
  <div class="stage">
    ${deck.slides.map((slide) => renderSlide(slide, brand)).join("\n")}
  </div>
</body>
</html>`;
}
