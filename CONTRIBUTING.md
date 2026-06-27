# Contributing

Thanks for helping improve xhs-cardgen.

## Project Boundary

The reusable core should stay generic:

- Markdown parsing
- slide planning
- theme rendering
- PNG export
- stable `slides.json` schema

Personal article workflows, prompts, one-off templates, and private Typora habits should live outside the core package or inside a clearly named adapter.

## Development

```bash
npm install
npm run check
npm run example
```

Desktop app:

```bash
npm --prefix apps/desktop install
npm run desktop:dev
```

## Pull Requests

Before opening a PR:

- keep changes scoped
- update docs for user-facing behavior
- add or update examples when the output format changes
- run `npm run check`

## Code Style

- Use ESM for reusable core modules.
- Keep I/O at workflow or adapter boundaries.
- Keep parser, planner, renderer, and exporter modules separate.
- Prefer small pure functions for transformations.
- Do not add AI provider code directly into core planning; add it as an adapter or separate workflow.
