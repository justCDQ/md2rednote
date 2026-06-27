import { mkdir } from "node:fs/promises";
import path from "node:path";
import { buildFromMarkdown } from "../../workflow/build-from-markdown.mjs";
import { prepareTyporaMarkdown } from "./prepare-typora-markdown.mjs";

export async function buildTyporaMarkdown({
  input,
  outDir,
  title,
  brand,
  theme,
  exportImages,
  chromePath,
  filePrefix,
  limits,
  overflowFallback,
  maxOverflowAttempts,
}) {
  await mkdir(outDir, { recursive: true });
  const prepared = await prepareTyporaMarkdown({ input, outDir });
  const result = await buildFromMarkdown({
    input: prepared.normalizedPath,
    outDir,
    title,
    brand,
    theme,
    exportImages,
    chromePath,
    filePrefix,
    limits,
    overflowFallback,
    maxOverflowAttempts,
  });

  return {
    ...result,
    adapter: {
      name: "typora",
      manifestPath: prepared.manifestPath,
      copiedAssets: prepared.copiedAssets,
      normalizedPath: prepared.normalizedPath,
      source: path.resolve(input),
    },
  };
}
