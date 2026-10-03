#!/usr/bin/env bash
cd "$(dirname "$0")"

# 1) rozpakuj każdy zip do folderu o tej samej nazwie
for z in *.zip; do
  [ -e "$z" ] || continue
  d="${z%.zip}"
  [ -e "$d" ] && continue
  unzip -q "$z" -d "$d"
done

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
