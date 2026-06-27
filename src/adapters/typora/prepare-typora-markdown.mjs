import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function isRemoteOrDataUrl(src) {
  return /^(https?:)?\/\//.test(src) || /^data:/.test(src);
}

function stripWrappingAngles(src) {
  return src.replace(/^<(.+)>$/, "$1");
}

function safeAssetName(index, src) {
  const decoded = decodeURIComponent(src.split(/[?#]/)[0]);
  const ext = path.extname(decoded) || ".png";
  const base = path.basename(decoded, ext).replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${String(index).padStart(2, "0")}-${base || "image"}${ext}`;
}

async function copyLocalImage({ src, markdownDir, mediaDir, index }) {
  const cleanSrc = stripWrappingAngles(src);
  if (isRemoteOrDataUrl(cleanSrc)) return cleanSrc;

  const absoluteSource = path.isAbsolute(cleanSrc)
    ? cleanSrc
    : path.resolve(markdownDir, decodeURIComponent(cleanSrc));
  const filename = safeAssetName(index, cleanSrc);
  const target = path.join(mediaDir, filename);

  await mkdir(mediaDir, { recursive: true });
  await copyFile(absoluteSource, target);

  return `media/${filename}`;
}

export async function prepareTyporaMarkdown({ input, outDir }) {
  const markdown = await readFile(input, "utf8");
  const markdownDir = path.dirname(input);
  const adapterDir = path.join(outDir, "_typora");
  const mediaDir = path.join(outDir, "media");
  const copiedAssets = [];
  let imageIndex = 1;

  await mkdir(adapterDir, { recursive: true });

  const normalized = await replaceAsync(
    markdown,
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    async (match, alt, src) => {
      try {
        const rewritten = await copyLocalImage({
          src: src.trim(),
          markdownDir,
          mediaDir,
          index: imageIndex,
        });
        imageIndex += 1;
        if (rewritten.startsWith("media/")) copiedAssets.push(rewritten);
        return `![${alt}](${rewritten})`;
      } catch (error) {
        return `${match}\n\n> Typora adapter warning: could not copy image \`${src}\`.`;
      }
    },
  );

  const normalizedPath = path.join(adapterDir, "normalized.md");
  const manifestPath = path.join(adapterDir, "manifest.json");

  await writeFile(normalizedPath, normalized, "utf8");
  await writeFile(
    manifestPath,
    `${JSON.stringify(
      {
        source: input,
        normalized: normalizedPath,
        copiedAssets,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  return {
    normalizedPath,
    manifestPath,
    copiedAssets,
  };
}

async function replaceAsync(source, pattern, replacer) {
  const matches = Array.from(source.matchAll(pattern));
  if (matches.length === 0) return source;

  const replacements = await Promise.all(matches.map((match) => replacer(...match)));
  let output = "";
  let lastIndex = 0;

  matches.forEach((match, index) => {
    output += source.slice(lastIndex, match.index);
    output += replacements[index];
    lastIndex = match.index + match[0].length;
  });

  output += source.slice(lastIndex);
  return output;
}
