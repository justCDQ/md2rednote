export const DEFAULT_DECK_SIZE = {
  width: 1242,
  height: 1660,
};

export const DEFAULT_LIMITS = {
  maxBlocksPerSlide: 4,
  maxCharactersPerSlide: 360,
  maxCodeLinesPerSlide: 24,
  maxParagraphCharacters: 150,
  maxQuoteCharacters: 120,
  maxListItemsPerBlock: 5,
  maxCodeLinesPerBlock: 24,
  maxTableRowsPerBlock: 5,
};

export function createDeck({ title, brand, slides, width, height, source }) {
  return {
    schemaVersion: 1,
    title: title || "Markdown Cards",
    brand: brand || title || "Markdown",
    width: width || DEFAULT_DECK_SIZE.width,
    height: height || DEFAULT_DECK_SIZE.height,
    source: source || null,
    slides,
  };
}

export function createSlide({ type, kicker, title, hero, blocks, footer }) {
  return {
    ...(type ? { type } : {}),
    kicker: kicker || "",
    title: title || "",
    ...(hero ? { hero } : {}),
    footer: footer || "",
    blocks: blocks || [],
  };
}
