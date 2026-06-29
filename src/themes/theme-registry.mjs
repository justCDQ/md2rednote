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

export const themeRegistry = {
  "warm-tech": {
    label: "暖色技术风",
    render: warmTechTheme,
  },
  "clean-white": {
    label: "清爽白底",
    render: cleanWhiteTheme,
  },
  "dark-code": {
    label: "深色代码风",
    render: darkCodeTheme,
  },
  "mint-editorial": {
    label: "薄荷杂志风",
    render: mintEditorialTheme,
  },
  "tech-black-gold": {
    label: "技术黑金",
    render: techBlackGoldTheme,
  },
  "minimal-paper": {
    label: "极简纸感",
    render: minimalPaperTheme,
  },
  "magazine-bold": {
    label: "杂志标题风",
    render: magazineBoldTheme,
  },
  "notebook-soft": {
    label: "日系手账",
    render: notebookSoftTheme,
  },
  "launch-deck": {
    label: "产品发布会风",
    render: launchDeckTheme,
  },
  "academic-note": {
    label: "学术笔记风",
    render: academicNoteTheme,
  },
};

export function getTheme(name = "warm-tech") {
  return themeRegistry[name] || themeRegistry["warm-tech"];
}
