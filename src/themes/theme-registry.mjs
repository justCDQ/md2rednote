import { cleanWhiteTheme } from "./clean-white.mjs";
import { darkCodeTheme } from "./dark-code.mjs";
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
};

export function getTheme(name = "warm-tech") {
  return themeRegistry[name] || themeRegistry["warm-tech"];
}
