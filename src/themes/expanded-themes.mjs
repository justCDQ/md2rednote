import { createCardTheme } from "./card-theme-factory.mjs";

export function techBlackGoldTheme(size) {
  return createCardTheme({
    ...size,
    palette: {
      pageBg: "#11100d",
      cardBg: "linear-gradient(180deg, #171511 0%, #0f0e0b 100%)",
      cardAccentBg: "radial-gradient(circle at 88% 10%, rgba(224, 184, 92, 0.18), transparent 25%)",
      text: "#fff6dc",
      bodyText: "#e7dcc1",
      muted: "#b7a77f",
      border: "rgba(224, 184, 92, 0.28)",
      frame: "rgba(224, 184, 92, 0.14)",
      surface: "#201c13",
      surfaceAlt: "#2b2416",
      accent: "#d6ad4f",
      accentText: "#11100d",
      codeBg: "#050504",
      codeText: "#fff8e6",
      codeAccent: "#f4c96b",
      inlineBg: "#2b2416",
      inlineBorder: "rgba(224, 184, 92, 0.34)",
    },
    extraCss: `
      .card { border-width: 2px; }
      h1 { text-transform: none; }
      .topline { border-bottom-style: double; }
    `,
  });
}

export function minimalPaperTheme(size) {
  return createCardTheme({
    ...size,
    palette: {
      pageBg: "#efefec",
      cardBg: "linear-gradient(180deg, #fffefa 0%, #f8f7f2 100%)",
      cardAccentBg: "linear-gradient(180deg, transparent, transparent)",
      text: "#151515",
      bodyText: "#343434",
      muted: "#77746d",
      border: "rgba(21, 21, 21, 0.12)",
      frame: "rgba(21, 21, 21, 0.05)",
      surface: "#ffffff",
      surfaceAlt: "#f0eee7",
      accent: "#111111",
      accentText: "#ffffff",
      codeBg: "#f3f3f1",
      codeText: "#181818",
      codeAccent: "#55524a",
      inlineBg: "#f1f0ea",
      inlineBorder: "#dad8cf",
    },
    extraCss: `
      .card { padding: 92px 96px 84px; }
      .card::before { border-style: dashed; }
      h1 { font-size: 68px; font-weight: 760; }
      pre.code { background: #f4f4f1; }
    `,
  });
}

export function magazineBoldTheme(size) {
  return createCardTheme({
    ...size,
    palette: {
      pageBg: "#e9e3da",
      cardBg: "linear-gradient(180deg, #fffaf2 0%, #f5eee3 100%)",
      cardAccentBg: "linear-gradient(90deg, rgba(215, 44, 44, 0.17), transparent 42%)",
      text: "#101010",
      bodyText: "#2d2924",
      muted: "#7b6b5b",
      border: "rgba(16, 16, 16, 0.18)",
      frame: "rgba(215, 44, 44, 0.14)",
      surface: "#fff5e8",
      surfaceAlt: "#ecdcc9",
      accent: "#d72c2c",
      accentText: "#fff8ef",
      codeBg: "#111111",
      codeText: "#fff8ec",
      codeAccent: "#ffb0a8",
      inlineBg: "#f2e4d6",
      inlineBorder: "#e2c8b4",
    },
    extraCss: `
      h1 { font-size: 78px; line-height: 0.98; font-weight: 950; }
      .cover h1 { font-size: 96px; }
      .topline { text-transform: uppercase; }
      blockquote { font-size: 46px; }
    `,
  });
}

export function notebookSoftTheme(size) {
  return createCardTheme({
    ...size,
    palette: {
      pageBg: "#e5ebf2",
      cardBg: "linear-gradient(180deg, #fbf9f1 0%, #f5f0e4 100%)",
      cardAccentBg: "repeating-linear-gradient(0deg, transparent 0, transparent 78px, rgba(73, 105, 145, 0.08) 79px, transparent 80px)",
      text: "#1e2a32",
      bodyText: "#394851",
      muted: "#71808a",
      border: "rgba(57, 72, 81, 0.16)",
      frame: "rgba(73, 105, 145, 0.09)",
      surface: "#fffdf6",
      surfaceAlt: "#e9eef0",
      accent: "#496991",
      accentText: "#fbf9f1",
      codeBg: "#263746",
      codeText: "#f7fbff",
      codeAccent: "#b7d4f0",
      inlineBg: "#edf1f5",
      inlineBorder: "#d5dce4",
    },
    extraCss: `
      .card { border-radius: 0; }
      h1 { font-size: 66px; }
      p, ul, ol { line-height: 1.7; }
    `,
  });
}

export function launchDeckTheme(size) {
  return createCardTheme({
    ...size,
    palette: {
      pageBg: "#e8edf7",
      cardBg: "linear-gradient(180deg, #f8fbff 0%, #edf3ff 100%)",
      cardAccentBg: "radial-gradient(circle at 92% 8%, rgba(59, 91, 219, 0.18), transparent 28%)",
      text: "#0f172a",
      bodyText: "#263449",
      muted: "#62708a",
      border: "rgba(15, 23, 42, 0.14)",
      frame: "rgba(59, 91, 219, 0.10)",
      surface: "#ffffff",
      surfaceAlt: "#e2ebff",
      accent: "#3b5bdb",
      accentText: "#ffffff",
      codeBg: "#111827",
      codeText: "#eef4ff",
      codeAccent: "#a5b4fc",
      inlineBg: "#e8edff",
      inlineBorder: "#c7d2fe",
    },
    extraCss: `
      .card { padding: 78px 86px 72px; }
      h1 { font-size: 74px; }
      .answer, .flow span { border-radius: 0; }
    `,
  });
}

export function academicNoteTheme(size) {
  return createCardTheme({
    ...size,
    palette: {
      pageBg: "#e4e5df",
      cardBg: "linear-gradient(180deg, #fbfbf5 0%, #f1f1e8 100%)",
      cardAccentBg: "linear-gradient(90deg, rgba(38, 70, 83, 0.10), transparent 30%)",
      text: "#172022",
      bodyText: "#344044",
      muted: "#6c7476",
      border: "rgba(23, 32, 34, 0.16)",
      frame: "rgba(23, 32, 34, 0.08)",
      surface: "#fffffa",
      surfaceAlt: "#e5e7de",
      accent: "#264653",
      accentText: "#f8faf7",
      codeBg: "#172022",
      codeText: "#f4f8f6",
      codeAccent: "#9bd2c6",
      inlineBg: "#e8ece8",
      inlineBorder: "#ced7d3",
    },
    extraCss: `
      .topline { font-family: Georgia, "Times New Roman", serif; }
      h1 { font-family: Georgia, "Times New Roman", "PingFang SC", serif; font-size: 68px; }
      blockquote { font-family: Georgia, "Times New Roman", "PingFang SC", serif; font-weight: 700; }
    `,
  });
}
