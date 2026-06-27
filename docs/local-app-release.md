# Local App Release Guide

xhs-cardgen's desktop-friendly build is a lightweight local app:

```text
compiled Bun server
+ browser UI
+ macOS .app / Windows portable zip launcher
```

It is intentionally not an Electron app. The app starts a local server, opens the user's browser, and runs all UI locally.

## Why This Shape

- Small distribution compared with bundling a full browser runtime.
- Simple source code: one server file and one HTML file.
- Easy to debug: users can open `http://localhost:4927`.
- Works well for a Markdown-to-HTML workflow.

## Development

Install Bun from https://bun.sh, then run:

```bash
npm run local:dev
```

Open:

```text
http://localhost:4927
```

## Build

From the repository root:

```bash
npm run local:build
```

Outputs:

```text
dist-local/
  XHS Cardgen-mac.zip
  XHS Cardgen-win.zip
```

## macOS Package

The macOS zip contains:

```text
XHS Cardgen.app/
  Contents/
    MacOS/
      launch
      xhs-cardgen-local
    Resources/
      index.html
```

Double-clicking the app starts the local server and opens the browser.

## Windows Package

The Windows zip contains:

```text
XHS Cardgen-win/
  xhs-cardgen-local.exe
  index.html
  start.bat
```

Double-click `start.bat` to start the local server and open the browser.

## PNG Export

The local app previews cards in the browser. PNG export runs in the local server by launching system Chrome or Edge in headless mode.

- The app auto-detects common Chrome/Edge install paths.
- Users can paste a custom Chrome/Edge executable path in the UI.
- PNG files are written directly into the output folder under `cards/`.

This keeps the downloadable app small while avoiding browser-side downloads.

The tradeoff is that users need Chrome, Edge, or Chromium installed.

## Release Checklist

- [ ] `npm run check`
- [ ] `npm run local:dev`
- [ ] preview a Markdown file
- [ ] export PNGs with system Chrome/Edge
- [ ] `npm run local:build`
- [ ] test macOS zip on a clean machine, if releasing Mac
- [ ] test Windows zip on a Windows machine, if releasing Windows
