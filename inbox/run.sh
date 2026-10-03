#!/usr/bin/env bash
cd "$(dirname "$0")"

# 0) usuń znaki diakrytyczne z nazw wszystkich plików pdf/zip/docx
#    (także tych już przetworzonych w docs/ czy w rozpakowanych folderach).
#    Robi to python3, usuwając z nazwy wszystkie bajty >= 0x80 — działa
#    niezależnie od tego, czy nazwa jest w UTF-8, CP852/CP1250, czy już
#    „zepsuta” (mojibake) po rozpakowaniu przez unzip.
remove_diacritics() {
python3 - <<'PY'
import os, sys

EXTS = ('.pdf', '.zip', '.docx')

changed = 0
for dirpath, dirnames, filenames in os.walk('.'):
    dirnames[:] = [d for d in dirnames if d != '.git']
    for fn in filenames:
        if not fn.lower().endswith(EXTS):
            continue
        raw = fn.encode('utf-8', 'surrogateescape')
        clean = raw.decode('ascii', 'ignore')
        if clean == fn:
            continue
        src = os.path.join(dirpath, fn)
        dst = os.path.join(dirpath, clean)
        if os.path.lexists(dst):
            print('pomijam (kolizja): %s' % src, file=sys.stderr)
            continue
        os.rename(src, dst)
        changed += 1
print('przemianowano %d plików' % changed)
PY
}

remove_diacritics

# 1) rozpakuj każdy zip do folderu o tej samej nazwie
for z in *.zip; do
  [ -e "$z" ] || continue
  d="${z%.zip}"
  [ -e "$d" ] && continue
  unzip -q "$z" -d "$d"
done

remove_diacritics

# 2) każdy pdf/docx do własnego folderu w docs/
#    nazwa = ścieżka względna bez powtórzonych segmentów, np.
#    szlakiemludzibezdomnych/szlakiemludzibezdomnych/model-innowacji.pdf
#    -> szlakiemludzibezdomnych-model-innowacji
mkdir -p docs
find . -type f \( -iname '*.pdf' -o -iname '*.docx' \) \
  -not -path './docs/*' -not -path './markdown/*' -not -path './processed/*' -not -path './.git/*' |
  while IFS= read -r f; do
    rel="${f#./}"
    rel="${rel%.*}"
    name="$(printf '%s' "$rel" | tr '/' '\n' |
      awk 'prev != $0 { if (NR > 1) printf "-"; printf "%s", $0; prev = $0 }')"
    [ -z "$name" ] && name="doc"
    d="docs/$name"
    [ -e "$d/$(basename "$f")" ] && continue
    mkdir -p "$d"
    cp "$f" "$d/"
  done

# 3) konwertuj zawartość docs/*/ do markdown/
mkdir -p markdown
for d in docs/*/; do
  [ -d "$d" ] || continue
  f="$(find "$d" -type f \( -iname '*.pdf' -o -iname '*.docx' \) -print -quit)"
  [ -z "$f" ] && continue
  n="$(basename "$d")"
  [ -e "markdown/$n.md" ] && continue
  case "${f##*.}" in
  pdf | PDF)
    printf '# %s\n\n' "$n" >"markdown/$n.md"
    pdftotext -layout "$f" - >>"markdown/$n.md"
    ;;
  docx | DOCX) pandoc -f docx -t gfm "$f" -o "markdown/$n.md" ;;
  esac
done

# 4) For each markdown file, ask DeepSeek to extract title, url and tags
#    (categories + subcategories), then store them in the canonical `documents` /
#    `categories` schema (matching db/document.ts) with an OpenAI embedding.
#    Existing categories are passed to DeepSeek so it reuses them instead of
#    inventing new wording. Already-processed files (processed/*.json) are skipped;
#    re-run with FORCE=1 to reprocess.
export DEEPSEEK_URL="${DEEPSEEK_URL:-https://api.deepseek.com/anthropic}"
export DEEPSEEK_KEY="${DEEPSEEK_KEY:?DEEPSEEK_KEY is not set}"
export DEEPSEEK_MODEL="${DEEPSEEK_MODEL:-deepseek-chat}"
export OPENAI_API_KEY="${OPENAI_API_KEY:-}"

python3 ingest.py markdown/*.md
