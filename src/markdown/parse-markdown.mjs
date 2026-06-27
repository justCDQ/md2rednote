function stripYamlFrontmatter(markdown) {
  const normalized = markdown.replace(/\r\n?/g, "\n");
  if (!normalized.startsWith("---\n")) return normalized;
  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) return normalized;
  return normalized.slice(end + 5);
}

function isTableDivider(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function pushParagraph(blocks, lines) {
  if (lines.length === 0) return;
  const text = lines.join(" ").replace(/\s+/g, " ").trim();
  if (text) blocks.push({ type: "paragraph", text });
  lines.length = 0;
}

function parseList(lines, startIndex) {
  const ordered = /^\s*\d+\.\s+/.test(lines[startIndex]);
  const markerPattern = ordered ? /^\s*\d+\.\s+/ : /^\s*[-*+]\s+/;
  const items = [];
  let index = startIndex;

  while (index < lines.length && markerPattern.test(lines[index])) {
    items.push(lines[index].replace(markerPattern, "").trim());
    index += 1;
  }

  return {
    block: {
      type: ordered ? "steps" : "bullets",
      items,
    },
    nextIndex: index,
  };
}

function parseBlockquote(lines, startIndex) {
  const collected = [];
  let index = startIndex;

  while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
    collected.push(lines[index].replace(/^\s*>\s?/, ""));
    index += 1;
  }

  return {
    block: { type: "quote", text: collected.join(" ").trim() },
    nextIndex: index,
  };
}

function parseCodeBlock(lines, startIndex) {
  const open = lines[startIndex].match(/^\s*```([A-Za-z0-9_-]+)?\s*$/);
  const lang = open?.[1] || "text";
  const source = [];
  let index = startIndex + 1;

  while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
    source.push(lines[index]);
    index += 1;
  }

  return {
    block: { type: "code", lang, source: source.join("\n") },
    nextIndex: index < lines.length ? index + 1 : index,
  };
}

function parseTable(lines, startIndex) {
  const headers = splitTableRow(lines[startIndex]);
  const rows = [];
  let index = startIndex + 2;

  while (index < lines.length && /^\s*\|/.test(lines[index])) {
    rows.push(splitTableRow(lines[index]));
    index += 1;
  }

  return {
    block: { type: "table", headers, rows },
    nextIndex: index,
  };
}

function parseImage(line) {
  const match = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
  if (!match) return null;
  return {
    type: "image",
    alt: match[1],
    src: match[2],
  };
}

export function parseMarkdown(markdown) {
  const lines = stripYamlFrontmatter(markdown).split("\n");
  const document = {
    title: "",
    blocks: [],
  };
  const paragraphLines = [];

  for (let index = 0; index < lines.length; ) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      pushParagraph(document.blocks, paragraphLines);
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      pushParagraph(document.blocks, paragraphLines);
      const level = heading[1].length;
      const text = heading[2].trim();
      if (!document.title && level === 1) document.title = text;
      document.blocks.push({ type: "heading", level, text });
      index += 1;
      continue;
    }

    if (/^\s*```/.test(line)) {
      pushParagraph(document.blocks, paragraphLines);
      const result = parseCodeBlock(lines, index);
      document.blocks.push(result.block);
      index = result.nextIndex;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      pushParagraph(document.blocks, paragraphLines);
      const result = parseBlockquote(lines, index);
      document.blocks.push(result.block);
      index = result.nextIndex;
      continue;
    }

    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      pushParagraph(document.blocks, paragraphLines);
      const result = parseList(lines, index);
      document.blocks.push(result.block);
      index = result.nextIndex;
      continue;
    }

    if (
      /^\s*\|/.test(line) &&
      index + 1 < lines.length &&
      isTableDivider(lines[index + 1])
    ) {
      pushParagraph(document.blocks, paragraphLines);
      const result = parseTable(lines, index);
      document.blocks.push(result.block);
      index = result.nextIndex;
      continue;
    }

    const image = parseImage(line);
    if (image && trimmed === line.trim()) {
      pushParagraph(document.blocks, paragraphLines);
      document.blocks.push(image);
      index += 1;
      continue;
    }

    paragraphLines.push(trimmed);
    index += 1;
  }

  pushParagraph(document.blocks, paragraphLines);

  if (!document.title) {
    const firstHeading = document.blocks.find((block) => block.type === "heading");
    document.title = firstHeading?.text || "Markdown Cards";
  }

  return document;
}
