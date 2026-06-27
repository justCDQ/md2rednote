#!/bin/bash
set -e

APP_NAME="XHS Cardgen"
BIN_NAME="xhs-cardgen-local"
PORT="4927"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="${ROOT}/dist-local"
APP_DIR="${DIST}/${APP_NAME}.app"
CONTENTS="${APP_DIR}/Contents"
MACOS="${CONTENTS}/MacOS"
RESOURCES="${CONTENTS}/Resources"

mkdir -p "${DIST}"

echo "Compiling local app..."
bun build --compile "${ROOT}/apps/local/server.ts" --outfile "${DIST}/${BIN_NAME}"

echo "Building macOS app bundle..."
rm -rf "${APP_DIR}"
mkdir -p "${MACOS}" "${RESOURCES}"
cp "${DIST}/${BIN_NAME}" "${MACOS}/"
cp "${ROOT}/apps/local/index.html" "${RESOURCES}/"

cat > "${MACOS}/launch" << LAUNCHER
#!/bin/bash
DIR="\$(cd "\$(dirname "\$0")/../Resources" && pwd)"
BINDIR="\$(cd "\$(dirname "\$0")" && pwd)"
LOG="\$DIR/server.log"

lsof -ti :${PORT} | xargs kill -9 2>/dev/null || true
sleep 0.3

RESOURCES_DIR="\$DIR" XHS_CARDGEN_PORT=${PORT} nohup "\$BINDIR/${BIN_NAME}" > "\$LOG" 2>&1 &
SERVER_PID=\$!

for i in \$(seq 1 30); do
  if curl -s -o /dev/null "http://localhost:${PORT}/" 2>/dev/null; then
    open "http://localhost:${PORT}/"
    exit 0
  fi
  sleep 0.5
done

ERROR=\$(cat "\$LOG" 2>/dev/null | head -20)
osascript -e "display alert \"Failed to start ${APP_NAME}\" message \"\$ERROR\" as critical"
kill \$SERVER_PID 2>/dev/null || true
exit 1
LAUNCHER
chmod +x "${MACOS}/launch"

cat > "${CONTENTS}/Info.plist" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>${APP_NAME}</string>
  <key>CFBundleDisplayName</key>
  <string>${APP_NAME}</string>
  <key>CFBundleIdentifier</key>
  <string>dev.xhscardgen.local</string>
  <key>CFBundleVersion</key>
  <string>0.1.0</string>
  <key>CFBundleShortVersionString</key>
  <string>0.1.0</string>
  <key>CFBundleExecutable</key>
  <string>launch</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>LSMinimumSystemVersion</key>
  <string>12.0</string>
  <key>LSUIElement</key>
  <true/>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
PLIST

rm -f "${DIST}/${BIN_NAME}"

cd "${DIST}"
ditto -c -k --sequesterRsrc --keepParent "${APP_NAME}.app" "${APP_NAME}-mac.zip"
cd "${ROOT}"

echo "Building Windows portable package..."
WIN_DIR="${DIST}/${APP_NAME}-win"
rm -rf "${WIN_DIR}"
mkdir -p "${WIN_DIR}"

bun build --compile --target=bun-windows-x64 "${ROOT}/apps/local/server.ts" --outfile "${WIN_DIR}/${BIN_NAME}.exe"
cp "${ROOT}/apps/local/index.html" "${WIN_DIR}/"

cat > "${WIN_DIR}/start.bat" << BAT
@echo off
cd /d "%~dp0"
set RESOURCES_DIR=%~dp0
set XHS_CARDGEN_PORT=${PORT}

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :${PORT} ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul
start "" ${BIN_NAME}.exe
timeout /t 2 /nobreak >nul
start http://localhost:${PORT}/
BAT

cd "${DIST}"
zip -r "${APP_NAME}-win.zip" "${APP_NAME}-win/"
cd "${ROOT}"
rm -rf "${WIN_DIR}"

echo "Done:"
echo "  macOS:   ${DIST}/${APP_NAME}-mac.zip"
echo "  Windows: ${DIST}/${APP_NAME}-win.zip"
