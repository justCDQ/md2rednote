import { postJsonWithCode } from "./api-client.js";
import { clearDraft, createDeckEditor, loadDraft, saveDraft } from "./deck-editor.js";
import { diagnosticsText, updateSystemInfo } from "./diagnostics.js";
import { makePreviewHtml } from "./preview.js";
import { renderThemeCards, themeName } from "./theme-ui.js";

const els = {
  file: document.querySelector("#file"),
  markdown: document.querySelector("#markdown"),
  title: document.querySelector("#title"),
  brand: document.querySelector("#brand"),
  theme: document.querySelector("#theme"),
  maxChars: document.querySelector("#maxChars"),
  maxBlocks: document.querySelector("#maxBlocks"),
  outputDir: document.querySelector("#outputDir"),
  chromePath: document.querySelector("#chromePath"),
  preview: document.querySelector("#preview"),
  save: document.querySelector("#save"),
  png: document.querySelector("#png"),
  status: document.querySelector("#status"),
  frame: document.querySelector("#frame"),
  busyOverlay: document.querySelector("#busyOverlay"),
  busyTitle: document.querySelector("#busyTitle"),
  busyText: document.querySelector("#busyText"),
  systemVersion: document.querySelector("#systemVersion"),
  systemPlatform: document.querySelector("#systemPlatform"),
  systemPort: document.querySelector("#systemPort"),
  systemOutput: document.querySelector("#systemOutput"),
  systemChrome: document.querySelector("#systemChrome"),
  copyDiagnostics: document.querySelector("#copyDiagnostics"),
  themeGrid: document.querySelector("#themeGrid"),
  editor: document.querySelector("#editor"),
  slideList: document.querySelector("#slideList"),
  editorFields: document.querySelector("#editorFields"),
  applyEditor: document.querySelector("#applyEditor"),
  moveUp: document.querySelector("#moveUp"),
  moveDown: document.querySelector("#moveDown"),
  duplicateSlide: document.querySelector("#duplicateSlide"),
  deleteSlide: document.querySelector("#deleteSlide"),
  addBlock: document.querySelector("#addBlock"),
  newBlockType: document.querySelector("#newBlockType"),
  restoreDraft: document.querySelector("#restoreDraft"),
  clearDraft: document.querySelector("#clearDraft"),
};

const state = {
  filename: "article.md",
  currentDeck: null,
  currentHtml: "",
  busy: false,
  systemInfo: null,
  lastError: "",
  selectedSlideIndex: 0,
  hasManualEdits: false,
};

function getState() {
  return state;
}

function setState(patch) {
  Object.assign(state, patch);
}

function setStatus(message, tone = "neutral") {
  els.status.textContent = message;
  els.status.dataset.tone = tone;
}

function rememberError(message) {
  state.lastError = message || "";
}

function reportForDeck(deck) {
  return {
    slideCount: deck?.slides?.length || 0,
    exceedsXhsLimit: (deck?.slides?.length || 0) > 18,
  };
}

function setDeckStatus(prefix, deck, tone = "success") {
  const report = reportForDeck(deck);
  if (report.exceedsXhsLimit) {
    setStatus(`${prefix}：共 ${report.slideCount} 张卡片。小红书一次最多发布 18 张图片，建议删除卡片、调大每页字数/块数，或拆成多篇发布。`, "warning");
  } else {
    setStatus(`${prefix}：共 ${report.slideCount} 张卡片。`, tone);
  }
}

function friendlyError(error) {
  const code = error?.code || "";
  const message = error?.message || String(error || "未知错误");
  if (code === "EMPTY_MARKDOWN" || message.includes("Markdown content is empty")) {
    return "请先选择 Markdown 文件，或粘贴内容。";
  }
  if (code === "CHROME_NOT_FOUND" || message.includes("Chrome or Edge was not found")) {
    return "没有检测到 Chrome/Edge。请先安装 Chrome 或 Edge，或在上方填写浏览器可执行文件路径。";
  }
  if (code === "OUTPUT_DIR_NOT_WRITABLE") {
    return "输出文件夹不可写，请换一个有权限的文件夹。";
  }
  if (message.includes("Failed to create Chrome target") || message.includes("Timed out waiting for Chrome DevTools")) {
    return "无法启动本地 Chrome/Edge 截图服务。请确认浏览器路径正确，或关闭浏览器后重试。";
  }
  return message;
}

function setBusy(value, title = "正在处理", text = "请稍候，当前操作完成前暂时不能编辑或重复点击。") {
  state.busy = value;
  document.body.classList.toggle("is-busy", value);
  els.busyOverlay.classList.toggle("active", value);
  els.busyTitle.textContent = title;
  els.busyText.textContent = text;
  for (const control of document.querySelectorAll("input, textarea, select, button")) {
    control.disabled = value;
  }
}

function payload() {
  return {
    markdown: els.markdown.value,
    filename: state.filename,
    title: els.title.value.trim(),
    brand: els.brand.value.trim(),
    theme: els.theme.value,
    maxCharactersPerSlide: Number(els.maxChars.value || 360),
    maxBlocksPerSlide: Number(els.maxBlocks.value || 4),
    outputDir: els.outputDir.value.trim(),
    chromePath: els.chromePath.value.trim(),
  };
}

function deckPayload() {
  return {
    deck: state.currentDeck,
    theme: els.theme.value,
    outputDir: els.outputDir.value.trim(),
    chromePath: els.chromePath.value.trim(),
  };
}

let deckEditor;

async function renderDeckPreview(deck, statusPrefix = "预览已更新") {
  const result = await postJsonWithCode("/api/render-deck", {
    deck,
    theme: els.theme.value,
  });
  state.currentDeck = result.deck;
  state.currentHtml = result.html;
  state.selectedSlideIndex = Math.min(state.selectedSlideIndex, Math.max(0, state.currentDeck.slides.length - 1));
  els.frame.srcdoc = makePreviewHtml(state.currentHtml, state.currentDeck);
  deckEditor.renderSlideList();
  deckEditor.renderSlideEditor();
  setDeckStatus(statusPrefix, state.currentDeck);
  saveDraft({ deck: state.currentDeck, selectedSlideIndex: state.selectedSlideIndex, theme: els.theme.value });
  return result;
}

async function renderPreview() {
  if (!els.markdown.value.trim()) {
    setStatus("请先选择 Markdown 文件，或粘贴内容。", "error");
    return null;
  }
  setStatus("正在生成预览...");
  const result = await postJsonWithCode("/api/render", payload());
  state.currentDeck = result.deck;
  state.currentHtml = result.html;
  state.selectedSlideIndex = 0;
  state.hasManualEdits = false;
  els.frame.srcdoc = makePreviewHtml(state.currentHtml, state.currentDeck);
  deckEditor.renderSlideList();
  deckEditor.renderSlideEditor();
  setDeckStatus("预览已生成", state.currentDeck);
  saveDraft({ deck: state.currentDeck, selectedSlideIndex: state.selectedSlideIndex, theme: els.theme.value });
  return result;
}

async function selectTheme(themeId) {
  if (state.busy || els.theme.value === themeId) return;
  els.theme.value = themeId;
  renderThemeCards(els.themeGrid, els.theme.value);
  if (!state.currentDeck) {
    setStatus(`已选择主题：${themeName(themeId)}。`);
    return;
  }
  try {
    setBusy(true, "正在切换主题", "正在用当前卡片内容刷新预览。");
    await renderDeckPreview(state.currentDeck, "主题已切换");
  } catch (error) {
    const message = friendlyError(error);
    rememberError(message);
    setStatus(message, "error");
  } finally {
    setBusy(false);
  }
}

function resetCurrentDeck() {
  state.currentDeck = null;
  state.currentHtml = "";
  state.hasManualEdits = false;
  state.selectedSlideIndex = 0;
  deckEditor.renderSlideList();
  deckEditor.renderSlideEditor();
}

function wireEvents() {
  els.file.addEventListener("change", async () => {
    if (state.busy) return;
    const file = els.file.files[0];
    if (!file) return;
    state.filename = file.name;
    els.markdown.value = await file.text();
    resetCurrentDeck();
    setStatus(`已读取 ${file.name}。`);
  });

  els.themeGrid.addEventListener("click", async (event) => {
    const card = event.target.closest("[data-theme-id]");
    if (!card) return;
    await selectTheme(card.dataset.themeId);
  });

  els.preview.addEventListener("click", async () => {
    if (state.busy) return;
    if (state.hasManualEdits && !window.confirm("重新从 Markdown 生成会覆盖当前手动修改，确定继续吗？")) return;
    try {
      setBusy(true, "正在生成预览", "正在解析 Markdown 并生成卡片预览。");
      await renderPreview();
    } catch (error) {
      const message = friendlyError(error);
      rememberError(message);
      setStatus(message, "error");
    } finally {
      setBusy(false);
    }
  });

  els.save.addEventListener("click", async () => {
    if (state.busy) return;
    try {
      if (!state.currentDeck && !els.markdown.value.trim()) {
        setStatus("请先选择 Markdown 文件，或粘贴内容。", "error");
        return;
      }
      setBusy(true, "正在保存文件", "正在检查分页并写入 HTML/JSON。");
      setStatus("正在保存预览文件...");
      const result = state.currentDeck
        ? await postJsonWithCode("/api/save-deck", deckPayload())
        : await postJsonWithCode("/api/save", payload());
      if (state.currentDeck) {
        state.currentDeck = result.deck;
        state.currentHtml = result.html || state.currentHtml;
        deckEditor.renderSlideList();
        deckEditor.renderSlideEditor();
      }
      await postJsonWithCode("/api/open", { path: result.outputDir });
      if (result.report?.exceedsXhsLimit) {
        setStatus(`已保存到 ${result.outputDir}。当前共 ${result.report.slideCount} 张，超过小红书单次 18 张上限。`, "warning");
      } else {
        setStatus(`已保存到 ${result.outputDir}`, "success");
      }
    } catch (error) {
      const message = friendlyError(error);
      rememberError(message);
      setStatus(message, "error");
    } finally {
      setBusy(false);
    }
  });

  els.png.addEventListener("click", async () => {
    if (state.busy) return;
    try {
      setBusy(true, "正在导出 PNG", "正在检查分页、调用本地 Chrome/Edge 截图并写入输出文件夹。");
      if (!state.currentDeck) await renderPreview();
      if (!state.currentDeck) return;
      setStatus("正在调用本地 Chrome/Edge 导出 PNG...");
      const result = await postJsonWithCode("/api/export-deck-png", deckPayload());
      state.currentDeck = result.deck;
      deckEditor.renderSlideList();
      deckEditor.renderSlideEditor();
      const overflowPages = result.report?.overflowPages || result.overflowReport.filter((item) => item.hasOverflow).map((item) => item.index);
      await postJsonWithCode("/api/open", { path: result.outputDir });
      const warnings = [];
      if (result.report?.exceedsXhsLimit) warnings.push(`共 ${result.report.slideCount} 张，超过小红书单次 18 张上限`);
      if (overflowPages.length) warnings.push(`第 ${overflowPages.join("、")} 张可能溢出，请降低每页字数或每页块数后重新生成`);
      setStatus(
        warnings.length
          ? `已导出 ${result.files.length} 张卡片，但需要注意：${warnings.join("；")}。`
          : `已导出 ${result.files.length} 张卡片到 ${result.outputDir}`,
        warnings.length ? "warning" : "success",
      );
    } catch (error) {
      const message = friendlyError(error);
      rememberError(message);
      setStatus(message, "error");
    } finally {
      setBusy(false);
    }
  });

  els.copyDiagnostics.addEventListener("click", async () => {
    if (state.busy) return;
    const text = diagnosticsText({ systemInfo: state.systemInfo, payload, lastError: state.lastError });
    try {
      await navigator.clipboard.writeText(text);
      setStatus("诊断信息已复制，可以粘贴到 GitHub issue。", "success");
    } catch {
      window.prompt("复制下面的诊断信息：", text);
    }
  });

  els.restoreDraft.addEventListener("click", async () => {
    const draft = loadDraft();
    if (!draft) {
      setStatus("没有可恢复的本地草稿。", "warning");
      return;
    }
    state.currentDeck = draft.deck;
    state.selectedSlideIndex = draft.selectedSlideIndex || 0;
    state.hasManualEdits = true;
    if (draft.theme) els.theme.value = draft.theme;
    renderThemeCards(els.themeGrid, els.theme.value);
    await renderDeckPreview(state.currentDeck, "草稿已恢复");
  });

  els.clearDraft.addEventListener("click", () => {
    clearDraft();
    setStatus("本地草稿已清除。", "success");
  });
}

async function loadSystemInfo() {
  try {
    const res = await fetch("/api/system");
    const system = await res.json();
    state.systemInfo = system;
    updateSystemInfo(els, system);
    if (system.defaultOutput) els.outputDir.placeholder = system.defaultOutput;
    if (system.chromePath) {
      els.chromePath.value = system.chromePath;
      setStatus("已检测到 Chrome/Edge，准备就绪。");
    } else {
      setStatus("未检测到 Chrome/Edge。可以先安装浏览器，或手动填写浏览器路径。", "warning");
    }
  } catch (error) {
    rememberError(error.message);
    setStatus("环境检测失败，请刷新页面重试。", "warning");
  }
}

function boot() {
  deckEditor = createDeckEditor({
    els,
    getState,
    setState,
    renderDeckPreview,
    setStatus,
  });
  deckEditor.wire();
  renderThemeCards(els.themeGrid, els.theme.value);
  wireEvents();
  loadSystemInfo();
  if (loadDraft()) setStatus("检测到本地草稿，可在卡片编辑区点击“恢复草稿”。", "warning");
}

boot();
