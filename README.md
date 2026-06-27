# md2rednote

Convert Markdown articles into Xiaohongshu-ready image cards.

This repository has two surfaces:

- Local app: a Mac/Windows-friendly tool for people who want to choose a Markdown file and export cards without using the terminal.
- CLI/core: reusable modules and commands for developers, automation, and future integrations.

Personal Typora-specific workflows should live outside this directory, for example in `../event-loop-xiaohongshu-cards`.

## Local App

The local app lives in `apps/local` and reuses the shared core from `src`. It starts a local server and opens the browser, so the downloadable app stays small and simple. PNG export uses system Chrome/Edge in headless mode and writes images directly into the output folder.

Development:

```bash
npm run local:dev
```

Build distributable packages:

```bash
npm run local:build
```

See [docs/local-app-release.md](./docs/local-app-release.md) for macOS and Windows release notes.

## CLI Quick Start

## Current Workflow

```text
Markdown
-> parseMarkdown()
-> planSlides()
-> slides.json
-> renderDeckHtml()
-> preview.html
-> exportPngCards()
-> PNG cards
```

The first version is conservative: it keeps the article structure and turns headings, paragraphs, lists, quotes, tables, images, and fenced code blocks into editable card data. It does not rewrite the article into marketing copy.

The current content splitting flow does not call an LLM. It uses deterministic Markdown parsing, block splitting, and pagination rules.

## Usage

Install dependencies:

```bash
npm install
```

Generate cards:

```bash
npx md2rednote build ./examples/event-loop-mini.md --out ./dist/event-loop-mini
```

Generate only `slides.json` and `preview.html`:

```bash
npx md2rednote build ./examples/event-loop-mini.md --out ./dist/event-loop-mini --no-images
```

On macOS, the CLI defaults to:

```text
/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

If Chrome is somewhere else, pass:

```bash
npx md2rednote build ./article.md --chrome /path/to/chrome
```

Use the Typora side adapter:

```bash
npx md2rednote typora ~/Desktop/article.markdown --out ./dist/article
```

The Typora adapter lives under `src/adapters/typora`. It prepares Markdown for the generic core by copying local images into the output folder and rewriting image paths. It does not change the core Markdown parser, planner, renderer, or exporter.

## Pagination and Overflow Fallback

The planner splits large blocks before placing them on cards:

- long paragraphs are split by sentence
- long quotes are split by sentence
- long lists are split into smaller list blocks
- long code blocks are split by line count
- long tables are split by row count

When exporting images, the workflow renders the cards once in system Chrome/Edge and reports pages that may overflow. It does not automatically rewrite or repeatedly re-plan content. If overflow is reported, lower `--max-chars` or `--max-blocks` and regenerate.

Xiaohongshu supports up to 18 images in one post. The local app warns when a deck exceeds 18 cards.

Useful options:

```bash
npx md2rednote build ./article.md \
  --max-chars 300 \
  --max-blocks 3 \
  --attempts 4
```

Disable the fallback loop:

```bash
npx md2rednote build ./article.md --no-fallback
```

## Themes

Built-in themes:

- `warm-tech`：暖色技术风
- `clean-white`：清爽白底
- `dark-code`：深色代码风
- `mint-editorial`：薄荷杂志风

CLI example:

```bash
npx md2rednote build ./article.md --theme dark-code
```

## Output

```text
dist/article/
  slides.json
  preview.html
  cards/
    card-01.png
    card-02.png
  media/
    01-local-image.png
  _typora/
    normalized.md
    manifest.json
```

## Markdown Support

Supported in the first version:

- `#` through `######` headings
- paragraphs
- unordered lists
- ordered lists
- fenced code blocks
- blockquotes
- pipe tables
- Markdown images
- YAML frontmatter stripping

Typora Markdown is supported as normal Markdown. Typora-specific customization should be layered on top of this core instead of being embedded into the reusable modules.

## Architecture

```text
src/
  adapters/
    typora/
      build-typora.mjs
      prepare-typora-markdown.mjs
  core/
    schema.mjs
  markdown/
    parse-markdown.mjs
  planner/
    plan-slides.mjs
    split-blocks.mjs
  render/
    block-renderers.mjs
    escape-html.mjs
    render-deck-html.mjs
  themes/
    warm-tech.mjs
  export/
    export-png-cards.mjs
  workflow/
    build-from-markdown.mjs
    overflow-fallback.mjs
```

The stable internal contract is `slides.json`. Future AI workflows should generate the same deck schema, then reuse the renderer and exporter.

See [docs/repository-guide.md](./docs/repository-guide.md) for the full repository layout and contribution boundary.

## More Docs

- [Developer introduction](./docs/developer-introduction.md)
- [User guide](./docs/user-guide.md)
- [Local app release guide](./docs/local-app-release.md)

## Personal Workflow Boundary

Keep personal article pipelines beside this package:

```text
articles/
  xhs-cardgen/                  # reusable open-source core
  event-loop-xiaohongshu-cards/ # personal/custom Typora workflow and outputs
```

This keeps the public tool maintainable while still allowing heavily customized article workflows.

Typora-specific behavior belongs in one of two places:

- reusable Typora compatibility: `xhs-cardgen/src/adapters/typora`
- personal article production: sibling folders such as `event-loop-xiaohongshu-cards`

Avoid adding personal prompts, article-specific slide choices, or one-off visual tweaks to the reusable core.
