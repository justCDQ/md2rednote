# Changelog

All notable changes to md2rednote will be documented in this file.

This project follows simple GitHub Release versioning. Update the top `Unreleased` section during development, then move entries under the release version before publishing.

## Unreleased

- Split the local app frontend into maintainable JS/CSS modules.
- Improve the generated card editor with block add/delete/reorder controls and local draft recovery.
- Add versioned local app release artifacts through `npm run local:build`.
- Add `npm run release:check` for pre-release validation.
- Document the GitHub Actions follow-up, which requires a token with `workflow` scope.

## 0.1.0

- Initial open-source release.
- Convert Markdown into Xiaohongshu-ready card previews and PNG exports.
- Provide a lightweight local app for macOS and Windows.
- Support multiple visual themes and generated deck editing.
- Keep content generation local and rule-based by default.
