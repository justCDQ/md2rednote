export const TEMPLATE_PRESETS = {
  "tech-tutorial": {
    label: "技术教程",
    theme: "warm-tech",
    limits: {
      maxCharactersPerSlide: 380,
      maxBlocksPerSlide: 4,
      densityProfile: "standard",
      minFillRatio: 0.45,
      codeSplitStrategy: "avoid",
    },
    kickerLabels: {
      Overview: "导览",
      Markdown: "文章",
      Section: "章节",
      Detail: "拆解",
      Note: "补充",
    },
  },
  "code-deep-dive": {
    label: "代码深潜",
    theme: "dark-code",
    limits: {
      maxCharactersPerSlide: 330,
      maxBlocksPerSlide: 3,
      densityProfile: "loose",
      minFillRatio: 0.4,
      codeSplitStrategy: "avoid",
    },
    kickerLabels: {
      Overview: "入口",
      Markdown: "代码笔记",
      Section: "源码段落",
      Detail: "关键实现",
      Note: "边界情况",
    },
  },
  "study-notes": {
    label: "学习笔记",
    theme: "notebook-soft",
    limits: {
      maxCharactersPerSlide: 420,
      maxBlocksPerSlide: 5,
      densityProfile: "compact",
      minFillRatio: 0.42,
      codeSplitStrategy: "oversize",
    },
    kickerLabels: {
      Overview: "总览",
      Markdown: "学习笔记",
      Section: "知识点",
      Detail: "展开",
      Note: "备注",
    },
  },
  "interview-qna": {
    label: "面试题卡",
    theme: "launch-deck",
    limits: {
      maxCharactersPerSlide: 360,
      maxBlocksPerSlide: 4,
      densityProfile: "standard",
      minFillRatio: 0.44,
      codeSplitStrategy: "avoid",
    },
    kickerLabels: {
      Overview: "题单",
      Markdown: "面试题",
      Section: "题目",
      Detail: "解析",
      Note: "追问",
    },
  },
  "opinion-magazine": {
    label: "观点杂志",
    theme: "magazine-bold",
    limits: {
      maxCharactersPerSlide: 320,
      maxBlocksPerSlide: 3,
      densityProfile: "loose",
      minFillRatio: 0.38,
      codeSplitStrategy: "oversize",
    },
    kickerLabels: {
      Overview: "观点",
      Markdown: "长文拆解",
      Section: "主张",
      Detail: "论据",
      Note: "补充",
    },
  },
};

export function getTemplatePreset(templateId = "tech-tutorial") {
  return TEMPLATE_PRESETS[templateId] || TEMPLATE_PRESETS["tech-tutorial"];
}

export function applyTemplateToDeck(deck, templateId) {
  const preset = getTemplatePreset(templateId);
  return {
    ...deck,
    slides: deck.slides.map((slide) => ({
      ...slide,
      kicker: preset.kickerLabels[slide.kicker] || slide.kicker,
    })),
  };
}
