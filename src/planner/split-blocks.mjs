function splitTextBySentence(text, maxCharacters) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxCharacters) return [normalized];

  const sentences = normalized
    .split(/(?<=[。！？.!?])\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
  const source = sentences.length > 1 ? sentences : normalized.match(new RegExp(`.{1,${maxCharacters}}`, "g")) || [];
  const chunks = [];
  let current = "";

  for (const part of source) {
    if (!current) {
      current = part;
      continue;
    }

    if ((current + part).length > maxCharacters) {
      chunks.push(current.trim());
      current = part;
    } else {
      current = `${current}${part}`;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function splitItems(items, maxItems) {
  const chunks = [];
  for (let index = 0; index < items.length; index += maxItems) {
    chunks.push(items.slice(index, index + maxItems));
  }
  return chunks;
}

function splitCode(source, maxLines, minTailLines = 4) {
  const lines = source.split("\n");
  const chunks = [];
  if (lines.length <= maxLines) return [source];

  const tailLines = lines.length % maxLines;
  const safeMaxLines =
    tailLines > 0 && tailLines < minTailLines && lines.length > maxLines
      ? Math.max(1, Math.ceil(lines.length / Math.ceil(lines.length / maxLines)))
      : maxLines;

  for (let index = 0; index < lines.length; index += safeMaxLines) {
    chunks.push(lines.slice(index, index + safeMaxLines).join("\n"));
  }
  return chunks;
}

function splitTable(block, maxRows) {
  if (block.rows.length <= maxRows) return [block];
  const chunks = [];
  for (let index = 0; index < block.rows.length; index += maxRows) {
    chunks.push({
      ...block,
      rows: block.rows.slice(index, index + maxRows),
    });
  }
  return chunks;
}

export function splitBlock(block, limits) {
  if (block.type === "paragraph") {
    return splitTextBySentence(block.text, limits.maxParagraphCharacters).map((text) => ({
      ...block,
      text,
    }));
  }

  if (block.type === "quote") {
    return splitTextBySentence(block.text, limits.maxQuoteCharacters).map((text) => ({
      ...block,
      text,
    }));
  }

  if (block.type === "bullets" || block.type === "steps") {
    return splitItems(block.items, limits.maxListItemsPerBlock).map((items) => ({
      ...block,
      items,
    }));
  }

  if (block.type === "code" && limits.codeSplitStrategy === "strict") {
    return splitCode(block.source, limits.maxCodeLinesPerBlock, limits.minCodeTailLines).map((source, index, parts) => ({
      ...block,
      source,
      caption: parts.length > 1 ? `Part ${index + 1}/${parts.length}` : undefined,
    }));
  }

  if (block.type === "table") {
    return splitTable(block, limits.maxTableRowsPerBlock);
  }

  return [block];
}

export function splitBlocks(blocks, limits) {
  return blocks.flatMap((block) => splitBlock(block, limits));
}
