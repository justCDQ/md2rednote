import { escapeHtml } from "./dom-utils.js";

export const TEMPLATES = [
  {
    id: "tech-tutorial",
    name: "技术教程",
    description: "保留文章结构，适合概念讲解和步骤拆解",
    theme: "warm-tech",
    controls: { maxChars: 380, maxBlocks: 4, densityProfile: "standard", minFillRatio: 45, codeSplitStrategy: "avoid" },
  },
  {
    id: "code-deep-dive",
    name: "代码深潜",
    description: "更保守的分页，优先保持代码块完整",
    theme: "dark-code",
    controls: { maxChars: 330, maxBlocks: 3, densityProfile: "loose", minFillRatio: 40, codeSplitStrategy: "avoid" },
  },
  {
    id: "study-notes",
    name: "学习笔记",
    description: "信息密度更高，适合知识点和复盘记录",
    theme: "notebook-soft",
    controls: { maxChars: 420, maxBlocks: 5, densityProfile: "compact", minFillRatio: 42, codeSplitStrategy: "oversize" },
  },
  {
    id: "interview-qna",
    name: "面试题卡",
    description: "题目、解析、追问的节奏更清晰",
    theme: "launch-deck",
    controls: { maxChars: 360, maxBlocks: 4, densityProfile: "standard", minFillRatio: 44, codeSplitStrategy: "avoid" },
  },
  {
    id: "opinion-magazine",
    name: "观点杂志",
    description: "更强标题感，适合观点输出和文章拆解",
    theme: "magazine-bold",
    controls: { maxChars: 320, maxBlocks: 3, densityProfile: "loose", minFillRatio: 38, codeSplitStrategy: "oversize" },
  },
];

export function templateById(templateId) {
  return TEMPLATES.find((template) => template.id === templateId) || TEMPLATES[0];
}

export function renderTemplateCards(container, selectedTemplate) {
  container.innerHTML = TEMPLATES.map((template) => `
    <button class="template-card${template.id === selectedTemplate ? " active" : ""}" type="button" data-template-id="${template.id}">
      <span class="template-name">${escapeHtml(template.name)}</span>
      <span class="template-description">${escapeHtml(template.description)}</span>
    </button>
  `).join("");
}
