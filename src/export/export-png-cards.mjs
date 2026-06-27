import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

export function loadPlaywright() {
  try {
    return require("playwright");
  } catch (error) {
    throw new Error(
      "Playwright is required to export PNG cards. Run `npm install` in xhs-cardgen or provide NODE_PATH to an existing Playwright install.",
    );
  }
}

export async function measureHtmlOverflow({ htmlPath, deck, chromePath }) {
  const { chromium } = loadPlaywright();
  const width = deck.width || 1242;
  const height = deck.height || 1660;
  const launchOptions = {
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : {}),
  };

  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });

  await page.goto(pathToFileURL(htmlPath).href);
  await page.locator(".card").first().waitFor();

  const overflowReport = await page.$$eval(".card", (cards) =>
    cards.map((card, index) => {
      const overflowingChildren = Array.from(card.querySelectorAll("*"))
        .filter((node) => node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth)
        .slice(0, 6)
        .map((node) => ({
          tag: node.tagName.toLowerCase(),
          className: node.className || "",
          scrollHeight: node.scrollHeight,
          clientHeight: node.clientHeight,
          scrollWidth: node.scrollWidth,
          clientWidth: node.clientWidth,
        }));

      return {
        index: index + 1,
        scrollHeight: card.scrollHeight,
        clientHeight: card.clientHeight,
        scrollWidth: card.scrollWidth,
        clientWidth: card.clientWidth,
        hasOverflow: card.scrollHeight > card.clientHeight || card.scrollWidth > card.clientWidth,
        overflowingChildren,
      };
    }),
  );

  await browser.close();
  return overflowReport;
}

export async function exportPngCards({ htmlPath, outDir, deck, chromePath, filePrefix = "card" }) {
  const { chromium } = loadPlaywright();
  const width = deck.width || 1242;
  const height = deck.height || 1660;

  await mkdir(outDir, { recursive: true });

  const launchOptions = {
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : {}),
  };

  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });

  await page.goto(pathToFileURL(htmlPath).href);
  await page.locator(".card").first().waitFor();

  const overflowReport = await measureHtmlOverflow({ htmlPath, deck, chromePath });

  const cards = await page.locator(".card").all();
  const files = [];

  for (let index = 0; index < cards.length; index += 1) {
    const filename = `${filePrefix}-${String(index + 1).padStart(2, "0")}.png`;
    const filePath = path.join(outDir, filename);
    await cards[index].screenshot({ path: filePath });
    files.push(filePath);
  }

  await browser.close();

  return {
    files,
    overflowReport,
  };
}
