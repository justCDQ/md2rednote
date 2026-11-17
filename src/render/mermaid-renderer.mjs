import { renderMermaidSVG } from "beautiful-mermaid";

const diagramCache = new Map();

function sanitizeSvg(svg) {
  return String(svg || "")
    .replace(/\s*@import\s+url\([^;]+;?/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*')/gi, "");
}

function readSvgSize(svg) {
  const viewBox = svg.match(/\bviewBox=["']\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)\s*["']/i);
  if (viewBox) {
    return { width: Number(viewBox[1]) || 1, height: Number(viewBox[2]) || 1 };
  }
  const width = Number(svg.match(/\bwidth=["']([\d.]+)["']/i)?.[1]) || 1;
  const height = Number(svg.match(/\bheight=["']([\d.]+)["']/i)?.[1]) || 1;
  return { width, height };
}

export function renderMermaidDiagram(source) {
  const code = String(source || "").trim();
  if (diagramCache.has(code)) return diagramCache.get(code);

  let result;
  try {
    if (!code) throw new Error("Mermaid source is empty.");
    const svg = sanitizeSvg(
      renderMermaidSVG(code, {
        bg: "var(--mermaid-bg)",
        fg: "var(--mermaid-fg)",
        line: "var(--mermaid-line)",
        accent: "var(--mermaid-accent)",
        muted: "var(--mermaid-muted)",
        surface: "var(--mermaid-surface)",
        border: "var(--mermaid-border)",
        font: "PingFang SC",
        padding: 28,
        nodeSpacing: 28,
        layerSpacing: 46,
        transparent: true,
      }),
    );
    if (!svg.trim().startsWith("<svg")) throw new Error("Mermaid renderer returned invalid SVG.");
    result = { svg, ...readSvgSize(svg), error: null };
  } catch (error) {
    result = {
      svg: "",
      width: 1,
      height: 1,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  diagramCache.set(code, result);
  return result;
}

export function estimateMermaidDiagramHeight(source, contentWidth, maxHeight = 720) {
  const rendered = renderMermaidDiagram(source);
  if (rendered.error) return Math.min(maxHeight, 280);
  const scaledHeight = (Math.max(1, contentWidth) * rendered.height) / Math.max(1, rendered.width);
  return Math.min(maxHeight, Math.max(180, scaledHeight));
}
