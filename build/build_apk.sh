#!/usr/bin/env bash
# Build the release APK with EAS and place it at build/AgriSokoPocket_<CODE>.apk
#
# Prerequisites
#   npx eas-cli login          (once per machine)
#   npx eas-cli init           (once per project, writes extra.eas.projectId)
#
# Usage
#   bash build/build_apk.sh              # cloud build (recommended)
#   bash build/build_apk.sh --local      # local build (needs Android SDK + JDK)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MOBILE="$ROOT/mobile"
BUILD_DIR="$ROOT/build"

GROUP_CODE="$(python3 - "$MOBILE/app.json" <<'PY'
import json, sys
with open(sys.argv[1], encoding="utf-8") as handle:
    print(json.load(handle)["expo"]["extra"]["groupCode"])
PY
)"
APK_NAME="AgriSokoPocket_${GROUP_CODE}.apk"

if [ "$GROUP_CODE" = "GXX" ]; then
  echo "WARNING: app.json still uses the placeholder group code GXX."
  echo "         Run: python3 scripts/apply_group_code.py --group-code <your code>"
  echo
fi

cd "$MOBILE"

PROJECT_ID="$(python3 - app.json <<'PY'
import json, sys
with open(sys.argv[1], encoding="utf-8") as handle:
    print(json.load(handle)["expo"].get("extra", {}).get("eas", {}).get("projectId", ""))
PY
)"
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "00000000-0000-0000-0000-000000000000" ]; then
  echo "No EAS projectId is configured yet. Running 'eas init' first..."
  npx eas-cli init --non-interactive || npx eas-cli init
fi

echo "Building profile 'preview' (APK) for group $GROUP_CODE ..."
if [ "${1:-}" = "--local" ]; then
  npx eas-cli build --platform android --profile preview --local --non-interactive
  SOURCE_APK="$(ls -t build-*.apk 2>/dev/null | head -1 || true)"
  [ -n "$SOURCE_APK" ] || { echo "ERROR: no local APK produced"; exit 1; }
  mkdir -p "$BUILD_DIR"
  cp "$SOURCE_APK" "$BUILD_DIR/$APK_NAME"
else
  npx eas-cli build --platform android --profile preview --non-interactive --wait \
    --json > /tmp/opencode/eas-build.json
  URL="$(python3 -c "
import json
print(json.load(open('/tmp/opencode/eas-build.json'))[0]['artifacts']['buildUrl'])
")"
  echo "Downloading $URL"
  mkdir -p "$BUILD_DIR"
  curl -fL "$URL" -o "$BUILD_DIR/$APK_NAME"
fi

ls -lh "$BUILD_DIR/$APK_NAME"
echo
echo "APK ready: build/$APK_NAME"
echo "Attach this exact file to the GitHub v1.0.0 release."
