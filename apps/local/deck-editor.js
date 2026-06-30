import { clone, escapeHtml } from "./dom-utils.js";

export const DRAFT_KEY = "md2rednote.localDeckDraft.v1";

const ITEM_BLOCK_TYPES = new Set(["bullets", "steps", "chips", "flow", "pipeline"]);

function blockLabel(block) {
  const labels = {
    paragraph: "段落",
    subheading: "子标题",
    quote: "引用",
    code: "代码",
    bullets: "无序列表",
    steps: "有序列表",
    table: "表格 JSON",
    image: "图片",
    chips: "标签",
    flow: "流程",
    pipeline: "管线",
    roleGrid: "角色网格 JSON",
    answer: "答案",
    html: "HTML",
  };
  return labels[block?.type] || `未知块：${block?.type || "unknown"}`;
}

function blockToolbar(block, index) {
  return `
    <div class="block-toolbar">
      <span class="block-type">${index + 1}. ${blockLabel(block)}</span>
      <button type="button" data-block-action="up" data-block-index="${index}">上</button>
      <button type="button" data-block-action="down" data-block-index="${index}">下</button>
      <button type="button" data-block-action="delete" data-block-index="${index}">删</button>
    </div>
  `;
}

function renderBlockEditor(block, index) {
  const type = block?.type || "paragraph";
  const toolbar = blockToolbar(block, index);
  if (type === "paragraph" || type === "quote" || type === "subheading") {
    return `
      <div class="block-editor" data-block-index="${index}" data-block-type="${type}">
        ${toolbar}
        <textarea data-field="text">${escapeHtml(block.text || "")}</textarea>
      </div>
    `;
  }
  if (type === "code") {
    return `
      <div class="block-editor" data-block-index="${index}" data-block-type="code">
        ${toolbar}
        <input data-field="lang" value="${escapeHtml(block.lang || "")}" placeholder="语言，例如 js" />
        <input data-field="caption" value="${escapeHtml(block.caption || "")}" placeholder="说明，可选" />
        <textarea data-field="source">${escapeHtml(block.source || "")}</textarea>
      </div>
    `;
  }
  if (ITEM_BLOCK_TYPES.has(type)) {
    return `
      <div class="block-editor" data-block-index="${index}" data-block-type="${type}">
        ${toolbar}
        <textarea data-field="items" placeholder="每行一项">${escapeHtml((block.items || []).join("\n"))}</textarea>
      </div>
    `;
  }
  if (type === "table" || type === "roleGrid") {
    return `
      <div class="block-editor" data-block-index="${index}" data-block-type="${type}">
        ${toolbar}
        <textarea data-field="json">${escapeHtml(JSON.stringify(block, null, 2))}</textarea>
      </div>
    `;
  }
  if (type === "image") {
    return `
      <div class="block-editor" data-block-index="${index}" data-block-type="image">
        ${toolbar}
        <input data-field="src" value="${escapeHtml(block.src || "")}" placeholder="图片路径" />
        <input data-field="alt" value="${escapeHtml(block.alt || "")}" placeholder="图片说明" />
      </div>
    `;
  }
  if (type === "answer") {
    return `
      <div class="block-editor" data-block-index="${index}" data-block-type="answer">
        ${toolbar}
        <input data-field="label" value="${escapeHtml(block.label || "")}" placeholder="标签" />
        <textarea data-field="text">${escapeHtml(block.text || "")}</textarea>
      </div>
    `;
  }
  if (type === "html") {
    return `
      <div class="block-editor" data-block-index="${index}" data-block-type="html">
        ${toolbar}
        <textarea data-field="html">${escapeHtml(block.html || "")}</textarea>
      </div>
    `;
  }
  return `
    <div class="block-editor" data-block-index="${index}" data-block-type="${escapeHtml(type)}">
      ${toolbar}
      <textarea data-field="json">${escapeHtml(JSON.stringify(block, null, 2))}</textarea>
    </div>
  `;
}

function readBlockEditor(node) {
  const type = node.dataset.blockType;
  const value = (field) => node.querySelector(`[data-field="${field}"]`)?.value || "";
  if (type === "paragraph" || type === "quote") return { type, text: value("text") };
  if (type === "subheading") return { type, text: value("text"), level: 4 };
  if (type === "code") {
    return {
      type,
      lang: value("lang") || "text",
      ...(value("caption") ? { caption: value("caption") } : {}),
      source: value("source"),
    };
  }
  if (ITEM_BLOCK_TYPES.has(type)) {
    return { type, items: value("items").split("\n").map((item) => item.trim()).filter(Boolean) };
  }
  if (type === "table" || type === "roleGrid" || node.querySelector('[data-field="json"]')) {
    try {
      const parsed = JSON.parse(value("json"));
      return parsed.type ? parsed : { ...parsed, type };
    } catch {
      throw new Error(`${blockLabel({ type })} 格式不是有效 JSON。`);
    }
  }
  if (type === "image") return { type, src: value("src"), alt: value("alt") };
  if (type === "answer") return { type, label: value("label"), text: value("text") };
  if (type === "html") return { type, html: value("html") };
  return { type: "paragraph", text: "" };
}

function createBlock(type) {
  if (type === "quote") return { type, text: "新的引用内容" };
  if (type === "subheading") return { type, text: "新的子标题", level: 4 };
  if (type === "bullets" || type === "steps") return { type, items: ["新的要点"] };
  if (type === "code") return { type, lang: "js", source: "console.log(\"hello\");" };
  if (type === "answer") return { type, label: "答案", text: "这里填写答案内容" };
  if (type === "image") return { type, src: "", alt: "图片说明" };
  return { type: "paragraph", text: "新的段落内容" };
}

export function saveDraft({ deck, selectedSlideIndex, theme }) {
  if (!deck) return;
  localStorage.setItem(DRAFT_KEY, JSON.stringify({
    deck,
    selectedSlideIndex,
    theme,
    savedAt: new Date().toISOString(),
  }));
}

export function loadDraft() {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.deck?.slides ? parsed : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export function createDeckEditor({ els, getState, setState, renderDeckPreview, setStatus }) {
  function renderSlideList() {
    const { currentDeck, selectedSlideIndex } = getState();
    if (!currentDeck?.slides?.length) {
      els.editor.classList.remove("active");
      els.slideList.innerHTML = "";
      return;
    }
    els.editor.classList.add("active");
    els.slideList.innerHTML = currentDeck.slides.map((slide, index) => `
      <button type="button" class="slide-tab${index === selectedSlideIndex ? " active" : ""}" data-slide-index="${index}">
        ${String(index + 1).padStart(2, "0")} / ${escapeHtml(slide.title || "未命名卡片")}
      </button>
    `).join("");
  }

  function renderSlideEditor() {
    const { currentDeck, selectedSlideIndex } = getState();
    const slide = currentDeck?.slides?.[selectedSlideIndex];
    if (!slide) {
      els.editorFields.innerHTML = "";
      return;
    }
    els.editorFields.innerHTML = `
      <label>顶部标签<input id="editKicker" value="${escapeHtml(slide.kicker || "")}" /></label>
      <label>标题<input id="editTitle" value="${escapeHtml(slide.title || "")}" /></label>
      <label>导语<textarea id="editHero">${escapeHtml(slide.hero || "")}</textarea></label>
      <label>页脚<input id="editFooter" value="${escapeHtml(slide.footer || "")}" /></label>
      <div>${(slide.blocks || []).map(renderBlockEditor).join("")}</div>
    `;
  }

  function readCurrentSlideFromEditor() {
    const { currentDeck, selectedSlideIndex } = getState();
    const slide = currentDeck.slides[selectedSlideIndex];
    const nextSlide = {
      ...slide,
      kicker: document.querySelector("#editKicker")?.value || "",
      title: document.querySelector("#editTitle")?.value || "",
      footer: document.querySelector("#editFooter")?.value || "",
      blocks: Array.from(document.querySelectorAll(".block-editor")).map(readBlockEditor),
    };
    const hero = document.querySelector("#editHero")?.value || "";
    if (hero.trim()) nextSlide.hero = hero;
    else delete nextSlide.hero;
    return nextSlide;
  }

  async function applyEditorChanges(statusPrefix = "手动修改已应用") {
    const state = getState();
    if (!state.currentDeck?.slides?.[state.selectedSlideIndex]) return;
    const nextDeck = clone(state.currentDeck);
    nextDeck.slides[state.selectedSlideIndex] = readCurrentSlideFromEditor();
    setState({ currentDeck: nextDeck, hasManualEdits: true });
    await renderDeckPreview(nextDeck, statusPrefix);
  }

  async function mutateSlides(mutator, statusPrefix) {
    const state = getState();
    if (!state.currentDeck) return;
    const nextDeck = clone(state.currentDeck);
    const nextIndex = mutator(nextDeck, state.selectedSlideIndex);
    setState({
      currentDeck: nextDeck,
      selectedSlideIndex: Math.max(0, Math.min(nextIndex, nextDeck.slides.length - 1)),
      hasManualEdits: true,
    });
    await renderDeckPreview(nextDeck, statusPrefix);
  }

  async function mutateBlocks(mutator, statusPrefix) {
    await applyEditorChanges("正在整理内容块");
    const state = getState();
    const nextDeck = clone(state.currentDeck);
    const slide = nextDeck.slides[state.selectedSlideIndex];
    slide.blocks ||= [];
    mutator(slide.blocks);
    setState({ currentDeck: nextDeck, hasManualEdits: true });
    await renderDeckPreview(nextDeck, statusPrefix);
  }

  function wire() {
    els.slideList.addEventListener("click", (event) => {
      const tab = event.target.closest("[data-slide-index]");
      if (!tab) return;
      setState({ selectedSlideIndex: Number(tab.dataset.slideIndex) });
      renderSlideList();
      renderSlideEditor();
    });

    els.applyEditor.addEventListener("click", async () => {
      await applyEditorChanges();
    });

    els.moveUp.addEventListener("click", async () => {
      await mutateSlides((deck, index) => {
        if (index <= 0) return index;
        [deck.slides[index - 1], deck.slides[index]] = [deck.slides[index], deck.slides[index - 1]];
        return index - 1;
      }, "卡片已上移");
    });

    els.moveDown.addEventListener("click", async () => {
      await mutateSlides((deck, index) => {
        if (index >= deck.slides.length - 1) return index;
        [deck.slides[index + 1], deck.slides[index]] = [deck.slides[index], deck.slides[index + 1]];
        return index + 1;
      }, "卡片已下移");
    });

    els.duplicateSlide.addEventListener("click", async () => {
      await mutateSlides((deck, index) => {
        deck.slides.splice(index + 1, 0, clone(deck.slides[index]));
        return index + 1;
      }, "卡片已复制");
    });

    els.deleteSlide.addEventListener("click", async () => {
      const { currentDeck } = getState();
      if (!currentDeck?.slides?.length) return;
      if (currentDeck.slides.length === 1) {
        setStatus("至少需要保留一张卡片。", "warning");
        return;
      }
      await mutateSlides((deck, index) => {
        deck.slides.splice(index, 1);
        return Math.min(index, deck.slides.length - 1);
      }, "卡片已删除");
    });

    els.addBlock.addEventListener("click", async () => {
      await mutateBlocks((blocks) => {
        blocks.push(createBlock(els.newBlockType.value));
      }, "内容块已新增");
    });

    els.editorFields.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-block-action]");
      if (!button) return;
      const index = Number(button.dataset.blockIndex);
      const action = button.dataset.blockAction;
      await mutateBlocks((blocks) => {
        if (action === "delete") {
          blocks.splice(index, 1);
          return;
        }
        if (action === "up" && index > 0) {
          [blocks[index - 1], blocks[index]] = [blocks[index], blocks[index - 1]];
        }
        if (action === "down" && index < blocks.length - 1) {
          [blocks[index + 1], blocks[index]] = [blocks[index], blocks[index + 1]];
        }
      }, action === "delete" ? "内容块已删除" : "内容块顺序已更新");
    });
  }

  return {
    applyEditorChanges,
    renderSlideEditor,
    renderSlideList,
    wire,
  };
}
