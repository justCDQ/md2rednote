# Repository Guide

xhs-cardgen has two product surfaces:

1. Local app for non-technical users.
2. CLI/core package for developers and automation.

## Layout

```text
xhs-cardgen/
  apps/
    local/                # Bun local server + browser UI
  build/
    create-local-app.sh   # macOS/Windows portable build script
  bin/                    # CLI entry
  src/                    # reusable core
    adapters/             # optional compatibility layers
    core/                 # schema and shared constants
    export/               # image export integrations
    markdown/             # Markdown parser
    planner/              # card planning and pagination
    render/               # HTML rendering
    themes/               # visual themes
    workflow/             # end-to-end workflows
  examples/               # small public examples
  docs/                   # release and architecture docs
  .github/                # issue templates and CI
```

## What Belongs in Core

Core code should be useful to everyone:

- Markdown parsing
- slide schema
- pagination
- theme rendering
- exporter interfaces
- stable workflows

## What Belongs in Adapters

Adapters translate source-specific behavior into generic Markdown/deck data:

- Typora local image handling
- future Notion export handling
- future Obsidian vault handling
- future AI rewrite provider handling

Adapters may do I/O and source-specific cleanup, but they should return data that the core already understands.

## What Stays Out of the Public Core

Keep these in sibling folders or private examples:

- personal prompts
- one-off article rewrites
- private style preferences
- client-specific templates
- generated outputs

For this workspace:

```text
articles/
  xhs-cardgen/                  # public/open-source repository
  event-loop-xiaohongshu-cards/ # personal Typora workflow and generated assets
```

## Release Checklist

- [ ] `npm run check`
- [ ] README updated
- [ ] examples still work
- [ ] local app opens
- [ ] macOS build produced, if releasing Mac
- [ ] Windows build produced, if releasing Windows
- [ ] GitHub release notes written
- [ ] generated `dist/` and `release/` artifacts are not committed
