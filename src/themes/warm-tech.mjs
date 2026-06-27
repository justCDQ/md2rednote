import { createCardTheme } from "./card-theme-factory.mjs";

export function warmTechTheme(size) {
  return createCardTheme({
    ...size,
    palette: {
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
    },
  });
}
