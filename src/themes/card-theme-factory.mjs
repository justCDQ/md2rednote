const defaultPalette = {
  pageBg: "#e7e1d5",
  cardBg: "linear-gradient(180deg, #fbf7ee 0%, #f5efe4 100%)",
  cardAccentBg: "radial-gradient(circle at 95% 8%, rgba(255, 111, 97, 0.16), transparent 22%)",
  text: "#171714",
  bodyText: "#302c26",
  muted: "#6f6355",
  border: "rgba(24, 22, 18, 0.16)",
  frame: "rgba(24, 22, 18, 0.08)",
  surface: "#fffaf0",
  surfaceAlt: "#ece2d1",
  accent: "#b94b37",
  accentText: "#fff8ef",
  codeBg: "#181817",
  codeText: "#f8f2e7",
  codeAccent: "#e8907b",
  inlineBg: "#eee7db",
  inlineBorder: "#ded5c7",
};

export function createCardTheme({ width, height, palette = {}, extraCss = "" }) {
  const p = { ...defaultPalette, ...palette };
  return `
    :root {
      color: ${p.text};
      background: ${p.pageBg};
      font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: ${p.pageBg}; }
    .stage {
      display: grid;
      grid-template-columns: repeat(3, ${width}px);
      gap: 32px;
      padding: 32px;
    }
    .card {
      position: relative;
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      background: ${p.cardAccentBg}, ${p.cardBg};
      border: 1px solid ${p.border};
      padding: 82px 88px 74px;
    }
    .card::before {
      content: "";
      position: absolute;
      inset: 28px;
      border: 2px solid ${p.frame};
      pointer-events: none;
    }
    .topline {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 32px;
      padding-bottom: 34px;
      border-bottom: 2px solid ${p.border};
      color: ${p.muted};
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0;
    }
    .topline span:first-child {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    main {
      position: relative;
      z-index: 1;
      height: calc(100% - 120px);
      display: flex;
      flex-direction: column;
    }
    h1 {
      margin: 58px 0 34px;
      max-width: 100%;
      color: ${p.text};
      font-size: 70px;
      line-height: 1.1;
      letter-spacing: 0;
      overflow-wrap: anywhere;
    }
    .cover h1 {
      margin-top: 120px;
      font-size: 82px;
      line-height: 1.04;
    }
    .hero {
      margin: 0 0 50px;
      max-width: 900px;
      color: ${p.bodyText};
      font-size: 42px;
      line-height: 1.38;
      font-weight: 700;
    }
    .content {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }
    p {
      margin: 0;
      color: ${p.bodyText};
      font-size: 34px;
      line-height: 1.62;
      letter-spacing: 0;
      overflow-wrap: anywhere;
    }
    strong { color: ${p.text}; font-weight: 850; }
    em { font-style: normal; color: ${p.accent}; font-weight: 800; }
    code.inline {
      display: inline-block;
      padding: 2px 9px;
      border: 1px solid ${p.inlineBorder};
      border-radius: 7px;
      background: ${p.inlineBg};
      color: ${p.accent};
      font-family: "SFMono-Regular", Menlo, Consolas, monospace;
      font-size: 0.88em;
    }
    blockquote {
      margin: 8px 0 0;
      padding: 34px 38px;
      border-left: 10px solid ${p.accent};
      background: ${p.surfaceAlt};
      color: ${p.text};
      font-size: 40px;
      line-height: 1.48;
      font-weight: 850;
    }
    ul, ol {
      margin: 0;
      padding-left: 44px;
      color: ${p.bodyText};
      font-size: 34px;
      line-height: 1.54;
    }
    li { margin: 0 0 20px; padding-left: 8px; overflow-wrap: anywhere; }
    table {
      width: 100%;
      border-collapse: collapse;
      background: ${p.surface};
      color: ${p.bodyText};
      font-size: 29px;
      line-height: 1.42;
    }
    th, td {
      border: 2px solid ${p.border};
      padding: 24px 22px;
      vertical-align: top;
      text-align: left;
      overflow-wrap: anywhere;
    }
    th {
      background: ${p.text};
      color: ${p.accentText};
      font-size: 28px;
    }
    pre.code {
      margin: 0;
      padding: 30px 32px;
      overflow: hidden;
      border: 2px solid ${p.border};
      background: ${p.codeBg};
      color: ${p.codeText};
      font-family: "SFMono-Regular", Menlo, Consolas, monospace;
      font-size: 25px;
      line-height: 1.48;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    pre.code::before {
      content: attr(data-lang);
      display: block;
      margin-bottom: 18px;
      color: ${p.codeAccent};
      font-family: "PingFang SC", sans-serif;
      font-size: 22px;
      font-weight: 900;
      text-transform: uppercase;
    }
    pre.code code {
      display: block;
    }
    .tok-comment { color: ${p.codeComment || "#8f9b8d"}; }
    .tok-keyword { color: ${p.codeKeyword || p.codeAccent}; font-weight: 850; }
    .tok-string { color: ${p.codeString || "#f6c177"}; }
    .tok-number { color: ${p.codeNumber || "#9ccfd8"}; }
    .tok-literal { color: ${p.codeLiteral || "#c4a7e7"}; font-weight: 760; }
    .tok-property { color: ${p.codeProperty || "#95b8ff"}; }
    .image-block {
      margin: 0;
      overflow: hidden;
      border: 2px solid ${p.border};
      background: ${p.surface};
    }
    .image-block img {
      display: block;
      width: 100%;
      max-height: 580px;
      object-fit: cover;
    }
    .image-block figcaption {
      padding: 18px 22px;
      color: ${p.muted};
      font-size: 24px;
      line-height: 1.35;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 18px;
      margin-top: 12px;
    }
    .chips span {
      padding: 16px 24px;
      border: 2px solid ${p.border};
      background: ${p.surface};
      color: ${p.bodyText};
      font-size: 34px;
      font-weight: 850;
    }
    .flow, .pipeline {
      display: grid;
      align-items: center;
      gap: 18px;
    }
    .flow {
      grid-template-columns: 1fr 80px 1fr 80px 1fr;
      margin-top: 24px;
    }
    .flow span, .pipeline span {
      min-height: 126px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      background: ${p.text};
      color: ${p.accentText};
      font-size: 32px;
      font-weight: 850;
      text-align: center;
    }
    .flow b {
      height: 3px;
      background: ${p.accent};
    }
    .pipeline {
      grid-template-columns: repeat(4, 1fr);
    }
    .pipeline span {
      min-height: 150px;
      background: ${p.surfaceAlt};
      color: ${p.text};
      border: 2px solid ${p.border};
    }
    .role-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 22px;
    }
    .role-grid section {
      min-height: 278px;
      padding: 30px;
      background: ${p.surface};
      border: 2px solid ${p.border};
    }
    .role-grid small {
      color: ${p.accent};
      font-size: 24px;
      font-weight: 900;
    }
    .role-grid h3 {
      margin: 18px 0 14px;
      font-size: 38px;
      line-height: 1.2;
    }
    .role-grid p {
      font-size: 28px;
      line-height: 1.48;
    }
    .answer {
      padding: 28px 34px;
      background: ${p.accent};
      color: ${p.accentText};
    }
    .answer small {
      display: block;
      margin-bottom: 12px;
      font-size: 24px;
      font-weight: 800;
      opacity: 0.88;
    }
    .answer strong {
      display: block;
      color: ${p.accentText};
      font-size: 42px;
      line-height: 1.22;
    }
    .mark {
      position: absolute;
      right: 88px;
      bottom: 54px;
      max-width: 720px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: ${p.muted};
      opacity: 0.54;
      font-size: 26px;
      font-weight: 900;
    }
    ${extraCss}
  `;
}
