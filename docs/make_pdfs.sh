#!/usr/bin/env bash
# Convert the Markdown evidence and report files to PDF.
#
# Pipeline: Markdown -> HTML (pandoc if present, otherwise a built-in
# Python converter) -> PDF (LibreOffice headless).
#
# Usage:  bash docs/make_pdfs.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT/build/pdf"
mkdir -p "$OUT_DIR"

SOURCES=(
  "$ROOT/docs/COMBO_A3_GXX_REPORT.md"
  "$ROOT/evidence/CONTRIBUTIONS.md"
  "$ROOT/evidence/TEST_LOG.md"
  "$ROOT/evidence/FEEDBACK.md"
  "$ROOT/evidence/AI_USE.md"
  "$ROOT/README.md"
)

have() { command -v "$1" >/dev/null 2>&1; }

md_to_html() {
  local src="$1" dst="$2"
  if have pandoc; then
    pandoc "$src" -f gfm -t html5 -s --metadata title="$(basename "$src")" -o "$dst"
    return
  fi
  python3 "$ROOT/docs/md_to_html.py" "$src" "$dst"
}

echo "Output directory: $OUT_DIR"
for src in "${SOURCES[@]}"; do
  case "$src" in
    */COMBO_A3_GXX_REPORT.md) base="COMBO_A3_GXX_REPORT" ;;
    */CONTRIBUTIONS.md)       base="CONTRIBUTIONS" ;;
    */TEST_LOG.md)            base="TEST_LOG" ;;
    */FEEDBACK.md)            base="FEEDBACK" ;;
    */AI_USE.md)              base="AI_USE" ;;
    */README.md)              base="README" ;;
    *)                        base="$(basename "${src%.md}")" ;;
  esac

  if [ ! -f "$src" ]; then
    echo "SKIP  $src (not found)"
    continue
  fi

  html="$OUT_DIR/$base.html"
  md_to_html "$src" "$html"
  echo "HTML  $html"

  soffice --headless --convert-to pdf --outdir "$OUT_DIR" "$html" >/dev/null 2>&1 \
    || { echo "FAIL  could not convert $html"; continue; }
  echo "PDF   $OUT_DIR/$base.pdf"
  rm -f "$html"
done

echo
echo "Done. PDFs are in $OUT_DIR"
echo "Copy the assessed PDFs into the locations listed in README.md -> Evidence files."
