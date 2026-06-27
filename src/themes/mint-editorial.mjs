import { createCardTheme } from "./card-theme-factory.mjs";

export function mintEditorialTheme(size) {
  return createCardTheme({
    ...size,
    palette: {
      pageBg: "#dfeae4",
      cardBg: "linear-gradient(180deg, #f7fbf6 0%, #edf5ef 100%)",
      cardAccentBg: "radial-gradient(circle at 92% 12%, rgba(39, 145, 112, 0.14), transparent 25%)",
      text: "#17231d",
      bodyText: "#31463b",
      muted: "#61756b",
      border: "rgba(23, 35, 29, 0.15)",
      frame: "rgba(23, 35, 29, 0.08)",
      surface: "#fbfff9",
      surfaceAlt: "#ddeee5",
      accent: "#277f65",
      accentText: "#f8fff9",
      codeBg: "#102018",
      codeText: "#e8fff1",
      codeAccent: "#86efac",
      inlineBg: "#e7f4ea",
      inlineBorder: "#c7dccd",
    },
  });
}
