export function makePreviewHtml(html, deck) {
  const width = deck.width || 1242;
  const height = deck.height || 1660;
  const scale = 0.32;
  const gap = 32;
  const columns = 2;
  const stageWidth = width * columns + gap;
  const previewCss = `
    <style>
      html, body { min-height: ${Math.ceil(height * scale) + 80}px; overflow: auto; }
      .stage {
        grid-template-columns: repeat(${columns}, ${width}px) !important;
        gap: ${gap}px !important;
        transform: scale(${scale});
        transform-origin: top left;
        width: ${stageWidth}px !important;
        padding: 24px !important;
      }
    </style>
  `;
  return html.replace("</head>", `${previewCss}</head>`);
}
