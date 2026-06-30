import { escapeHtml } from "./dom-utils.js";

export const THEMES = [
  { id: "warm-tech", name: "暖色技术风", description: "技术文章、教程、知识卡片", swatches: ["#fbf7ee", "#b94b37", "#181817"] },
  { id: "clean-white", name: "清爽白底", description: "通用笔记、轻量分享", swatches: ["#ffffff", "#2563eb", "#101828"] },
  { id: "dark-code", name: "深色代码风", description: "代码解析、开发笔记", swatches: ["#121821", "#2dd4bf", "#05070a"] },
  { id: "mint-editorial", name: "薄荷杂志风", description: "清新知识、生活方式", swatches: ["#f7fbf6", "#277f65", "#102018"] },
  { id: "tech-black-gold", name: "技术黑金", description: "架构、深度技术、硬核主题", swatches: ["#171511", "#d6ad4f", "#050504"] },
  { id: "minimal-paper", name: "极简纸感", description: "纯文本、清单、方法论", swatches: ["#fffefa", "#111111", "#f3f3f1"] },
  { id: "magazine-bold", name: "杂志标题风", description: "观点输出、封面冲击", swatches: ["#fffaf2", "#d72c2c", "#111111"] },
  { id: "notebook-soft", name: "日系手账", description: "学习笔记、复盘记录", swatches: ["#fbf9f1", "#496991", "#263746"] },
  { id: "launch-deck", name: "产品发布会风", description: "产品拆解、方案汇报", swatches: ["#f8fbff", "#3b5bdb", "#111827"] },
  { id: "academic-note", name: "学术笔记风", description: "论文笔记、概念解释", swatches: ["#fbfbf5", "#264653", "#172022"] },
];

export function renderThemeCards(container, selectedTheme) {
  container.innerHTML = THEMES.map((theme) => `
    <button class="theme-card${theme.id === selectedTheme ? " active" : ""}" type="button" data-theme-id="${theme.id}">
      <span class="theme-name">${escapeHtml(theme.name)}</span>
      <span class="theme-description">${escapeHtml(theme.description)}</span>
      <span class="swatches">${theme.swatches.map((color) => `<span style="background:${escapeHtml(color)}"></span>`).join("")}</span>
    </button>
  `).join("");
}

export function themeName(themeId) {
  return THEMES.find((theme) => theme.id === themeId)?.name || themeId;
}
