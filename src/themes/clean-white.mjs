import { createCardTheme } from "./card-theme-factory.mjs";

export function cleanWhiteTheme(size) {
  return createCardTheme({
    ...size,
    palette: {
      pageBg: "#eef0f2",
      cardBg: "linear-gradient(180deg, #ffffff 0%, #f7f8fa 100%)",
      cardAccentBg: "linear-gradient(135deg, rgba(28, 117, 188, 0.08), transparent 34%)",
      text: "#111827",
      bodyText: "#2f3a4a",
      muted: "#667085",
      border: "rgba(17, 24, 39, 0.14)",
      frame: "rgba(17, 24, 39, 0.07)",
      surface: "#f8fafc",
      surfaceAlt: "#eef4ff",
      accent: "#2563eb",
      accentText: "#ffffff",
      codeBg: "#101828",
      codeText: "#f9fafb",
      codeAccent: "#93c5fd",
      inlineBg: "#eef4ff",
      inlineBorder: "#c7d7fe",
    },
  });
}
