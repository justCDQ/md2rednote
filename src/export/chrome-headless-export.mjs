import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { renderSingleSlideHtml } from "../render/render-deck-html.mjs";

const DEFAULT_CHROME_CANDIDATES = {
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ],
  win32: [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ],
  linux: [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/microsoft-edge",
  ],
};

function fileExistsSync(candidate) {
  return !!candidate && existsSync(candidate);
}

export function findSystemChrome(explicitPath) {
  if (explicitPath && fileExistsSync(explicitPath)) return explicitPath;
  const candidates = DEFAULT_CHROME_CANDIDATES[process.platform] || DEFAULT_CHROME_CANDIDATES.linux;
  return candidates.find(fileExistsSync) || "";
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDevtools(port, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    for (const host of ["127.0.0.1", "localhost"]) {
      try {
        const res = await fetch(`http://${host}:${port}/json/version`);
        if (res.ok) return await res.json();
      } catch {}
    }
    await delay(150);
  }
  throw new Error("Timed out waiting for Chrome DevTools.");
}

async function chromeCommand(ws, method, params = {}) {
  const id = ++ws._id;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    ws._callbacks.set(id, { resolve, reject });
  });
}

function attachProtocol(ws) {
  ws._id = 0;
  ws._callbacks = new Map();
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const callback = ws._callbacks.get(message.id);
    if (!callback) return;
    ws._callbacks.delete(message.id);
    if (message.error) callback.reject(new Error(message.error.message));
    else callback.resolve(message.result);
  });
}

async function openWebSocket(url) {
  const ws = new WebSocket(url);
  attachProtocol(ws);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  return ws;
}

async function createPage(port, targetUrl) {
  for (const host of ["127.0.0.1", "localhost"]) {
    try {
      const res = await fetch(`http://${host}:${port}/json/new?${encodeURIComponent(targetUrl)}`, {
        method: "PUT",
      });
      if (res.ok) return res.json();
    } catch {}
  }
  throw new Error("Failed to create Chrome target.");
}

async function waitForPageReady(ws) {
  await chromeCommand(ws, "Runtime.evaluate", {
    expression: `new Promise((resolve) => {
      if (document.readyState === "complete") resolve(true);
      else window.addEventListener("load", () => resolve(true), { once: true });
    })`,
    awaitPromise: true,
  });
  await chromeCommand(ws, "Runtime.evaluate", {
    expression: `document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : true`,
    awaitPromise: true,
  });
}

async function fitViewportToPage(ws) {
  const result = await chromeCommand(ws, "Runtime.evaluate", {
    expression: `({
      width: Math.ceil(Math.max(
        document.documentElement.scrollWidth,
        document.body ? document.body.scrollWidth : 0
      )),
      height: Math.ceil(Math.max(
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0
      ))
    })`,
    returnByValue: true,
  });
  const size = result.result.value;
  await chromeCommand(ws, "Emulation.setDeviceMetricsOverride", {
    width: Math.max(1, size.width),
    height: Math.max(1, size.height),
    deviceScaleFactor: 1,
    mobile: false,
  });
}

async function getCards(ws) {
  const result = await chromeCommand(ws, "Runtime.evaluate", {
    expression: `Array.from(document.querySelectorAll(".card")).map((card, index) => {
      const rect = card.getBoundingClientRect();
      return {
        index: index + 1,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        hasOverflow: card.scrollHeight > card.clientHeight || card.scrollWidth > card.clientWidth
      };
    })`,
    returnByValue: true,
  });
  return result.result.value;
}

function pngBufferFromBase64(data) {
  return Buffer.from(data, "base64");
}

async function captureSingleSlidePng({ html, deck, chromePath, outPath }) {
  return withSystemChromePage({
    html,
    deck,
    chromePath,
    callback: async ({ ws }) => {
      const width = deck.width || 1242;
      const height = deck.height || 1660;
      const result = await chromeCommand(ws, "Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: true,
        clip: {
          x: 0,
          y: 0,
          width,
          height,
          scale: 1,
        },
        fromSurface: true,
      });
      await writeFile(outPath, pngBufferFromBase64(result.data));
    },
  });
}

async function withSystemChromePage({ html, deck, chromePath, callback }) {
  const executablePath = findSystemChrome(chromePath);
  if (!executablePath) {
    throw new Error("Chrome or Edge was not found. Install Chrome/Edge or pass a Chrome path.");
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "xhs-cardgen-"));
  const htmlPath = path.join(tempDir, "preview.html");
  await writeFile(htmlPath, html, "utf8");

  const port = 9300 + Math.floor(Math.random() * 500);
  const userDataDir = path.join(tempDir, "chrome-profile");
  const chrome = spawn(
    executablePath,
    [
      "--headless=new",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--no-default-browser-check",
      "--remote-debugging-address=127.0.0.1",
      "--remote-allow-origins=*",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userDataDir}`,
      `--window-size=${deck.width || 1242},${deck.height || 1660}`,
      "about:blank",
    ],
    {
      stdio: "ignore",
    },
  );

  let ws = null;
  try {
    await waitForDevtools(port);
    const target = await createPage(port, `file://${htmlPath}`);
    ws = await openWebSocket(target.webSocketDebuggerUrl);
    await chromeCommand(ws, "Page.enable");
    await chromeCommand(ws, "Runtime.enable");
    await waitForPageReady(ws);
    await fitViewportToPage(ws);
    const result = await callback({ ws, executablePath });
    return result;
  } finally {
    if (ws?.readyState === WebSocket.OPEN) ws.close();
    chrome.kill("SIGTERM");
    await delay(250);
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function measureHtmlOverflowWithSystemChrome({ html, deck, chromePath }) {
  return withSystemChromePage({
    html,
    deck,
    chromePath,
    callback: async ({ ws, executablePath }) => {
      const cards = await getCards(ws);
      return {
        overflowReport: cards.map(({ index, hasOverflow }) => ({ index, hasOverflow })),
        chromePath: executablePath,
      };
    },
  });
}

export async function exportPngCardsWithSystemChrome({
  html,
  deck,
  outDir,
  chromePath,
  filePrefix = "card",
  theme = "warm-tech",
  includeOverflowReport = false,
}) {
  await mkdir(outDir, { recursive: true });
  const executablePath = findSystemChrome(chromePath);
  if (!executablePath) {
    throw new Error("Chrome or Edge was not found. Install Chrome/Edge or pass a Chrome path.");
  }

  let overflowReport = [];
  if (includeOverflowReport) {
    try {
      const measured = await measureHtmlOverflowWithSystemChrome({ html, deck, chromePath });
      overflowReport = measured.overflowReport;
    } catch {
      overflowReport = [];
    }
  }

  const files = [];

  for (let index = 0; index < deck.slides.length; index += 1) {
    const slide = deck.slides[index];
    const outputPath = path.join(outDir, `${filePrefix}-${String(index + 1).padStart(2, "0")}.png`);
    await captureSingleSlidePng({
      html: renderSingleSlideHtml(deck, slide, { theme }),
      deck,
      chromePath,
      outPath: outputPath,
    });
    files.push(outputPath);
  }

  return {
    files,
    overflowReport,
    chromePath: executablePath,
  };
}
