import { escapeHtml, inlineMarkdown } from "./escape-html.mjs";
import { highlightCode } from "./code-highlight.mjs";

function renderParagraph(block) {
  return `<p>${inlineMarkdown(block.text)}</p>`;
}

function renderSubheading(block) {
  return `<h2 class="subheading">${inlineMarkdown(block.text)}</h2>`;
}

function renderList(tag, items) {
  return `<${tag}>${items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</${tag}>`;
}

function renderCode(block) {
  const label = block.caption ? `${block.lang || "text"} / ${block.caption}` : block.lang || "text";
  return `<pre class="code" data-lang="${escapeHtml(label)}"><code>${highlightCode(block.source, block.lang)}</code></pre>`;
}

function renderQuote(block) {
  return `<blockquote>${inlineMarkdown(block.text)}</blockquote>`;
}

function renderTable(block) {
  return `
    <table>
      <thead><tr>${block.headers.map((header) => `<th>${inlineMarkdown(header)}</th>`).join("")}</tr></thead>
      <tbody>
        ${block.rows
          .map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`)
          .join("")}
      </tbody>
    </table>
  `;
}

function renderImage(block) {
  return `
    <figure class="image-block">
      <img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt || "")}" />
      ${block.alt ? `<figcaption>${inlineMarkdown(block.alt)}</figcaption>` : ""}
    </figure>
  `;
}

function renderChips(block) {
  return `<div class="chips">${block.items.map((item) => `<span>${inlineMarkdown(item)}</span>`).join("")}</div>`;
}

function renderFlow(block) {
  return `<div class="flow">${block.items
    .map((item, index) => `<span>${inlineMarkdown(item)}</span>${index < block.items.length - 1 ? "<b></b>" : ""}`)
    .join("")}</div>`;
}

function renderPipeline(block) {
  return `<div class="pipeline">${block.items.map((item) => `<span>${inlineMarkdown(item)}</span>`).join("")}</div>`;
}

function renderRoleGrid(block) {
  return `
    <div class="role-grid">
      ${block.items
        .map(
          (item) => `
            <section>
              <small>${inlineMarkdown(item.number)}</small>
              <h3>${inlineMarkdown(item.title)}</h3>
              <p>${inlineMarkdown(item.text)}</p>
            </section>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderAnswer(block) {
  return `<div class="answer"><small>${inlineMarkdown(block.label)}</small><strong>${inlineMarkdown(block.text)}</strong></div>`;
}

export function renderBlock(block) {
  switch (block.type) {
    case "subheading":
      return renderSubheading(block);
    case "paragraph":
      return renderParagraph(block);
    case "bullets":
      return renderList("ul", block.items);
    case "steps":
      return renderList("ol", block.items);
    case "code":
      return renderCode(block);
    case "quote":
      return renderQuote(block);
    case "table":
      return renderTable(block);
    case "image":
      return renderImage(block);
    case "chips":
      return renderChips(block);
    case "flow":
      return renderFlow(block);
    case "pipeline":
      return renderPipeline(block);
    case "roleGrid":
      return renderRoleGrid(block);
    case "answer":
      return renderAnswer(block);
    case "html":
      return block.html;
    default:
      throw new Error(`Unsupported block type: ${block.type}`);
  }
}
