import { escapeHtml } from "./escape-html.mjs";

const LANGUAGE_ALIASES = {
  bash: "shell",
  cjs: "js",
  cmd: "shell",
  console: "shell",
  html: "markup",
  javascript: "js",
  jsx: "js",
  mjs: "js",
  py: "python",
  sh: "shell",
  shell: "shell",
  ts: "ts",
  tsx: "ts",
  typescript: "ts",
  vue: "markup",
  xml: "markup",
  yml: "yaml",
};

const KEYWORDS = {
  js: new Set([
    "await",
    "async",
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "default",
    "else",
    "export",
    "extends",
    "finally",
    "for",
    "from",
    "function",
    "if",
    "import",
    "in",
    "let",
    "new",
    "of",
    "return",
    "switch",
    "throw",
    "try",
    "typeof",
    "var",
    "while",
  ]),
  ts: new Set([
    "await",
    "async",
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "default",
    "else",
    "enum",
    "export",
    "extends",
    "finally",
    "for",
    "from",
    "function",
    "if",
    "implements",
    "import",
    "in",
    "interface",
    "let",
    "new",
    "of",
    "private",
    "protected",
    "public",
    "readonly",
    "return",
    "switch",
    "throw",
    "try",
    "type",
    "typeof",
    "var",
    "while",
  ]),
  python: new Set([
    "as",
    "async",
    "await",
    "break",
    "class",
    "continue",
    "def",
    "elif",
    "else",
    "except",
    "finally",
    "for",
    "from",
    "if",
    "import",
    "in",
    "is",
    "lambda",
    "pass",
    "return",
    "try",
    "while",
    "with",
    "yield",
  ]),
};

function normalizeLanguage(lang = "") {
  const normalized = String(lang).trim().toLowerCase().replace(/^\./, "");
  return LANGUAGE_ALIASES[normalized] || normalized || "text";
}

function wrap(className, value) {
  return `<span class="${className}">${escapeHtml(value)}</span>`;
}

function highlightByPattern(source, pattern, classify) {
  let output = "";
  let cursor = 0;
  pattern.lastIndex = 0;

  for (const match of source.matchAll(pattern)) {
    output += escapeHtml(source.slice(cursor, match.index));
    output += classify(match);
    cursor = match.index + match[0].length;
  }

  output += escapeHtml(source.slice(cursor));
  return output;
}

function highlightGenericCode(source, lang) {
  const keywords = KEYWORDS[lang] || KEYWORDS.js;
  const pattern =
    /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/\/.*|\/\*[\s\S]*?\*\/|#.*|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b)/g;

  return highlightByPattern(source, pattern, ([token]) => {
    if (/^(\/\/|\/\*|#)/.test(token)) return wrap("tok-comment", token);
    if (/^["'`]/.test(token)) return wrap("tok-string", token);
    if (/^\d/.test(token)) return wrap("tok-number", token);
    if (keywords.has(token)) return wrap("tok-keyword", token);
    if (/^(true|false|null|undefined|None|True|False)$/.test(token)) return wrap("tok-literal", token);
    return escapeHtml(token);
  });
}

function highlightJson(source) {
  return highlightByPattern(source,
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\b\d+(?:\.\d+)?\b/g,
    ([token, stringToken, colon, literal]) => {
      if (stringToken && colon) return `${wrap("tok-property", stringToken)}${escapeHtml(colon)}`;
      if (stringToken) return wrap("tok-string", stringToken);
      if (literal) return wrap("tok-literal", token);
      return wrap("tok-number", token);
    },
  );
}

function highlightCss(source) {
  return highlightByPattern(source,
    /(\/\*[\s\S]*?\*\/|#[0-9a-fA-F]{3,8}\b|[.#]?[A-Za-z_-][\w-]*(?=\s*:)|\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw)?\b|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g,
    ([token]) => {
      if (token.startsWith("/*")) return wrap("tok-comment", token);
      if (token.startsWith("#")) return wrap("tok-number", token);
      if (/^["']/.test(token)) return wrap("tok-string", token);
      if (/^\d/.test(token)) return wrap("tok-number", token);
      return wrap("tok-property", token);
    },
  );
}

function highlightMarkup(source) {
  return highlightByPattern(source, /(<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*?>)/g, ([token]) => {
    if (token.startsWith("<!--")) return wrap("tok-comment", token);
    const tagMatch = token.match(/^(<\/?)([A-Za-z][\w-]*)([\s\S]*?)(\/?>)$/);
    if (!tagMatch) return escapeHtml(token);
    const [, open, tag, attrs, close] = tagMatch;
    const attrsHtml = highlightByPattern(
      attrs,
      /([A-Za-z_:][\w:.-]*)(=)("[^"]*"|'[^']*')/g,
      ([full, name, eq, value]) => `${wrap("tok-property", name)}${escapeHtml(eq)}${wrap("tok-string", value || full)}`,
    );
    return `${escapeHtml(open)}${wrap("tok-keyword", tag)}${attrsHtml}${escapeHtml(close)}`;
  });
}

export function highlightCode(source, lang = "text") {
  const normalized = normalizeLanguage(lang);
  const value = String(source ?? "").trim();
  if (!value) return "";

  if (normalized === "text" || normalized === "plain") return escapeHtml(value);
  if (normalized === "json") return highlightJson(value);
  if (normalized === "css" || normalized === "scss" || normalized === "less") return highlightCss(value);
  if (normalized === "markup" || normalized === "html" || normalized === "xml") return highlightMarkup(value);
  if (normalized === "yaml") return highlightGenericCode(value, "shell");
  if (normalized === "shell") return highlightGenericCode(value, "shell");
  if (normalized === "python") return highlightGenericCode(value, "python");
  if (normalized === "js" || normalized === "ts") return highlightGenericCode(value, normalized);
  return highlightGenericCode(value, normalized);
}
