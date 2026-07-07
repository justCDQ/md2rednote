# Changelog

All notable changes to md2rednote will be documented in this file.

This project follows simple GitHub Release versioning. Update the top `Unreleased` section during development, then move entries under the release version before publishing.

## Unreleased

## 0.5.0

- Fix local Markdown image preview and export by resolving image paths through a local image proxy.
- Add an image base directory field for Markdown files that use relative image paths.
- Improve Markdown image parsing for image titles like `![alt](image.png "title")`.

## 0.4.0

- Add local app content templates that set recommended theme, density, code splitting, and card labels.
- Add generated-card refinement actions for splitting slides, merging the next slide, duplicating blocks, and clearing hero text.

## 0.3.0

- Split the local app frontend into maintainable JS/CSS modules.
- Improve the generated card editor with block add/delete/reorder controls and local draft recovery.
- Add versioned local app release artifacts through `npm run local:build`.
- Add `npm run release:check` for pre-release validation.
- Document the GitHub Actions follow-up, which requires a token with `workflow` scope.
- Add height-aware pagination with configurable content density, minimum page fill, and code split strategy.
- Avoid unnecessary code block splitting and isolated short code tails.
- Preserve heading ownership during sparse-page compaction so content is not moved under the wrong title.

## 0.1.0

- Initial open-source release.
- Convert Markdown into Xiaohongshu-ready card previews and PNG exports.
- Provide a lightweight local app for macOS and Windows.
- Support multiple visual themes and generated deck editing.
- Keep content generation local and rule-based by default.
