import { createCardTheme } from "./card-theme-factory.mjs";

export function darkCodeTheme(size) {
  return createCardTheme({
    ...size,
    palette: {
      pageBg: "#0e1116",
      cardBg: "linear-gradient(180deg, #121821 0%, #0f141b 100%)",
      cardAccentBg: "radial-gradient(circle at 88% 10%, rgba(45, 212, 191, 0.13), transparent 24%)",
      text: "#f7fafc",
      bodyText: "#d8dee9",
      muted: "#91a0b5",
      border: "rgba(229, 231, 235, 0.16)",
      frame: "rgba(229, 231, 235, 0.08)",
      surface: "#18202b",
      surfaceAlt: "#1d2a35",
      accent: "#2dd4bf",
      accentText: "#071316",
      codeBg: "#05070a",
      codeText: "#e5f4ff",
      codeAccent: "#5eead4",
      inlineBg: "#101820",
      inlineBorder: "#2c3a48",
    },
  });
}
