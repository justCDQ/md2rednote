#!/usr/bin/env bun
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { DEFAULT_LIMITS } from "../../src/core/schema.mjs";
import { parseMarkdown } from "../../src/markdown/parse-markdown.mjs";
import { planSlides } from "../../src/planner/plan-slides.mjs";
import { renderDeckHtml } from "../../src/render/render-deck-html.mjs";
import {
  exportPngCardsWithSystemChrome,
  findSystemChrome,
} from "../../src/export/chrome-headless-export.mjs";

const PORT = Number(process.env.XHS_CARDGEN_PORT || 4927);
const IS_WIN = process.platform === "win32";
const DEFAULT_OUTPUT = path.join(os.homedir(), "Desktop", "xhs-cardgen-exports");
const APP_VERSION = "0.1.0";

class AppError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

type RenderPayload = {
  markdown?: string;
  filename?: string;
  title?: string;
  brand?: string;
  theme?: string;
  maxCharactersPerSlide?: number;
  maxBlocksPerSlide?: number;
};

type SavePayload = RenderPayload & {
  outputDir?: string;
  chromePath?: string;
};

function findStaticFile(name: string): string {
  const candidates = [
    process.env.RESOURCES_DIR ? path.join(process.env.RESOURCES_DIR, name) : "",
    path.join(import.meta.dir, name),
    path.join(import.meta.dir, "..", name),
    path.join(process.cwd(), "apps/local", name),
  ].filter(Boolean);

  const found = candidates.find((candidate) => existsSync(candidate));
  return found ? readFileSync(found, "utf8") : "";
}

function openBrowser(url: string) {
  try {
    if (IS_WIN) {
      execFileSync("cmd", ["/c", "start", "", url]);
    } else if (process.platform === "darwin") {
      execFileSync("open", [url]);
    } else {
      execFileSync("xdg-open", [url]);
    }
  } catch {
    console.log(`Open ${url} in your browser.`);
  }
}

function sanitizeName(value: string) {
  return value.replace(/[<>:"/\\|?*\x00-\x1f]/g, "-").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "cards";
}

function ensureWritableDirectory(outputDir: string) {
  try {
    mkdirSync(outputDir, { recursive: true });
    const testPath = path.join(outputDir, `.xhs-cardgen-write-test-${Date.now()}`);
    writeFileSync(testPath, "ok", "utf8");
    unlinkSync(testPath);
  } catch {
    throw new AppError("OUTPUT_DIR_NOT_WRITABLE", "输出文件夹不可写，请换一个有权限的文件夹。");
  }
}

function createDeckFromMarkdown(payload: RenderPayload) {
  const markdown = payload.markdown || "";
  if (!markdown.trim()) throw new AppError("EMPTY_MARKDOWN", "请先选择 Markdown 文件，或粘贴内容。");

  const document = parseMarkdown(markdown);
  const limits = {
    ...DEFAULT_LIMITS,
    maxCharactersPerSlide: payload.maxCharactersPerSlide || 360,
    maxBlocksPerSlide: payload.maxBlocksPerSlide || 4,
  };
  const deck = planSlides(document, {
    title: payload.title || undefined,
    brand: payload.brand || undefined,
    source: payload.filename || "browser-import",
    limits,
  });
  const html = renderDeckHtml(deck, { theme: payload.theme || "warm-tech" });
  return { deck, html, document, limits };
}

function hasOverflow(report: Array<{ hasOverflow: boolean }>) {
  return report.some((item) => item.hasOverflow);
}

function createReport(deck: any, overflowReport: Array<{ index: number; hasOverflow: boolean }> = []) {
  const overflowPages = overflowReport.filter((item) => item.hasOverflow).map((item) => item.index);
  return {
    slideCount: deck.slides.length,
    exceedsXhsLimit: deck.slides.length > 18,
    xhsLimit: 18,
    overflowPages,
  };
}

async function readJson(req: Request) {
  try {
    return (await req.json()) as SavePayload;
  } catch {
    throw new Error("Invalid JSON payload.");
  }
}

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers || {}),
    },
  });
}

async function saveProject(payload: SavePayload) {
  const { deck, html } = createDeckFromMarkdown(payload);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const baseName = sanitizeName(deck.title || path.basename(payload.filename || "cards"));
  const outputDir = payload.outputDir?.trim() || path.join(DEFAULT_OUTPUT, `${baseName}-${stamp}`);

  ensureWritableDirectory(outputDir);
  writeFileSync(path.join(outputDir, "slides.json"), `${JSON.stringify(deck, null, 2)}\n`, "utf8");
  writeFileSync(path.join(outputDir, "preview.html"), html, "utf8");

  return {
    deck,
    outputDir,
    slidesPath: path.join(outputDir, "slides.json"),
    previewPath: path.join(outputDir, "preview.html"),
    report: createReport(deck),
  };
}

async function exportProject(payload: SavePayload) {
  const { deck, html } = createDeckFromMarkdown(payload);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const baseName = sanitizeName(deck.title || path.basename(payload.filename || "cards"));
  const outputDir = payload.outputDir?.trim() || path.join(DEFAULT_OUTPUT, `${baseName}-${stamp}`);
  const cardsDir = path.join(outputDir, "cards");

  ensureWritableDirectory(outputDir);
  writeFileSync(path.join(outputDir, "slides.json"), `${JSON.stringify(deck, null, 2)}\n`, "utf8");
  writeFileSync(path.join(outputDir, "preview.html"), html, "utf8");

  const exportResult = await exportPngCardsWithSystemChrome({
    html,
    deck,
    outDir: cardsDir,
    chromePath: payload.chromePath,
    theme: payload.theme || "warm-tech",
  });

  return {
    deck,
    outputDir,
    cardsDir,
    slidesPath: path.join(outputDir, "slides.json"),
    previewPath: path.join(outputDir, "preview.html"),
    files: exportResult.files,
    overflowReport: exportResult.overflowReport,
    report: createReport(deck, exportResult.overflowReport),
    chromePath: exportResult.chromePath,
  };
}

const INDEX_HTML = findStaticFile("index.html");

Bun.serve({
  port: PORT,
  idleTimeout: 255,
  async fetch(req) {
    const url = new URL(req.url);

    try {
      if (url.pathname === "/" || url.pathname === "/index.html") {
        return new Response(INDEX_HTML, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      if (url.pathname === "/api/render" && req.method === "POST") {
        const payload = await readJson(req);
        return json(createDeckFromMarkdown(payload));
      }

      if (url.pathname === "/api/save" && req.method === "POST") {
        return json(await saveProject(await readJson(req)));
      }

      if (url.pathname === "/api/export-png" && req.method === "POST") {
        return json(await exportProject(await readJson(req)));
      }

      if (url.pathname === "/api/system" && req.method === "GET") {
        return json({
          version: APP_VERSION,
          platform: process.platform,
          arch: process.arch,
          defaultOutput: DEFAULT_OUTPUT,
          chromePath: findSystemChrome(""),
          port: PORT,
        });
      }

      if (url.pathname === "/api/open" && req.method === "POST") {
        const payload = (await readJson(req)) as { path?: string };
        if (!payload.path) throw new Error("Missing path.");
        openBrowser(`file://${payload.path}`);
        return json({ ok: true });
      }

      return json({ error: "Not found" }, { status: 404 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const code =
        error instanceof AppError
          ? error.code
          : message.includes("Chrome or Edge was not found")
            ? "CHROME_NOT_FOUND"
            : "UNKNOWN";
      return json({ error: message, code }, { status: 500 });
    }
  },
});

const localUrl = `http://localhost:${PORT}`;
console.log(`XHS Cardgen running at ${localUrl}`);

if (process.env.XHS_CARDGEN_NO_OPEN !== "1") {
  openBrowser(localUrl);
}
