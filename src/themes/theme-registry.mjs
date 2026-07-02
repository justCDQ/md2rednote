import { cleanWhiteTheme } from "./clean-white.mjs";
import { darkCodeTheme } from "./dark-code.mjs";
import {
  academicNoteTheme,
  launchDeckTheme,
  magazineBoldTheme,
  minimalPaperTheme,
  notebookSoftTheme,
  techBlackGoldTheme,
} from "./expanded-themes.mjs";
import { mintEditorialTheme } from "./mint-editorial.mjs";
import { warmTechTheme } from "./warm-tech.mjs";
import { mergeLayoutMetrics } from "../planner/layout-metrics.mjs";

export const themeRegistry = {
  "warm-tech": {
    label: "暖色技术风",
    render: warmTechTheme,
    layoutMetrics: mergeLayoutMetrics(),
  },
  "clean-white": {
    label: "清爽白底",
    render: cleanWhiteTheme,
    layoutMetrics: mergeLayoutMetrics(),
  },
  "dark-code": {
    label: "深色代码风",
    render: darkCodeTheme,
    layoutMetrics: mergeLayoutMetrics(),
  },
  "mint-editorial": {
    label: "薄荷杂志风",
    render: mintEditorialTheme,
    layoutMetrics: mergeLayoutMetrics(),
  },
  "tech-black-gold": {
    label: "技术黑金",
    render: techBlackGoldTheme,
    layoutMetrics: mergeLayoutMetrics(),
  },
  "minimal-paper": {
    label: "极简纸感",
    render: minimalPaperTheme,
    layoutMetrics: mergeLayoutMetrics({
      cardPaddingTop: 92,
      cardPaddingRight: 96,
      cardPaddingBottom: 84,
      cardPaddingLeft: 96,
      titleFontSize: 68,
    }),
  },
  "magazine-bold": {
    label: "杂志标题风",
    render: magazineBoldTheme,
    layoutMetrics: mergeLayoutMetrics({
      titleFontSize: 78,
      titleLineHeight: 0.98,
      coverTitleFontSize: 96,
      quoteFontSize: 46,
      safetyRatio: 0.86,
    }),
  },
  "notebook-soft": {
    label: "日系手账",
    render: notebookSoftTheme,
    layoutMetrics: mergeLayoutMetrics({
      titleFontSize: 66,
      bodyLineHeight: 1.7,
      listLineHeight: 1.7,
    }),
  },
  "launch-deck": {
    label: "产品发布会风",
    render: launchDeckTheme,
    layoutMetrics: mergeLayoutMetrics({
      cardPaddingTop: 78,
      cardPaddingRight: 86,
      cardPaddingBottom: 72,
      cardPaddingLeft: 86,
      titleFontSize: 74,
      safetyRatio: 0.88,
    }),
  },
  "academic-note": {
    label: "学术笔记风",
    render: academicNoteTheme,
    layoutMetrics: mergeLayoutMetrics({
      titleFontSize: 68,
      quoteFontSize: 40,
    }),
  },
};

export function getTheme(name = "warm-tech") {
  return themeRegistry[name] || themeRegistry["warm-tech"];
}

export function getThemeLayoutMetrics(name = "warm-tech") {
  return getTheme(name).layoutMetrics || themeRegistry["warm-tech"].layoutMetrics;
}
