#!/usr/bin/env python3
"""Minimal, dependency-free Markdown (GitHub-flavoured subset) to HTML converter.

Used by ``docs/make_pdfs.sh`` when ``pandoc`` is not installed. It supports the
constructs that actually appear in this project's documentation:

* ATX headings (``#`` .. ``######``)
* paragraphs and hard line breaks
* fenced code blocks (``` ``` ... ``` ```)
* unordered and ordered lists (one nesting level)
* GitHub-style tables with a delimiter row
* block quotes
* horizontal rules
* inline ``code``, **bold**, *italic* and [text](url) links
* HTML escaping, so arbitrary content cannot break the output document

It is deliberately small: no extension syntax, no raw HTML passthrough.
"""

from __future__ import annotations

import html
import re
import sys
from pathlib import Path

CSS = """
:root { color-scheme: light; }
* { box-sizing: border-box; }
body {
  font-family: "DejaVu Sans", "Liberation Sans", Arial, sans-serif;
  font-size: 10.5pt;
  line-height: 1.5;
  color: #14181d;
  margin: 0 auto;
  max-width: 46rem;
  padding: 2.2rem 2rem 3rem;
}
h1, h2, h3, h4, h5, h6 { line-height: 1.25; color: #0d2b1c; page-break-after: avoid; }
h1 { font-size: 1.85rem; border-bottom: 3px solid #1f7a4d; padding-bottom: .4rem; margin-top: 0; }
h2 { font-size: 1.4rem; border-bottom: 1px solid #cfd8d2; padding-bottom: .25rem; margin-top: 1.9rem; }
h3 { font-size: 1.14rem; margin-top: 1.5rem; }
h4 { font-size: 1rem; margin-top: 1.2rem; }
p, li, td, th { orphans: 3; widows: 3; }
a { color: #12603c; text-decoration: none; word-break: break-word; }
code, pre {
  font-family: "DejaVu Sans Mono", "Liberation Mono", Consolas, monospace;
  font-size: .86em;
  background: #f2f5f3;
  border-radius: 4px;
}
code { padding: .12em .35em; border: 1px solid #dde5e0; }
pre {
  padding: .8rem 1rem;
  border: 1px solid #dde5e0;
  border-left: 4px solid #1f7a4d;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  page-break-inside: avoid;
}
pre code { padding: 0; border: 0; background: none; }
blockquote {
  margin: 1rem 0;
  padding: .3rem 1rem;
  border-left: 4px solid #b9c6be;
  background: #f7f9f8;
  color: #3a453e;
}
table { border-collapse: collapse; width: 100%; margin: 1rem 0; font-size: .92em; page-break-inside: avoid; }
th, td { border: 1px solid #cbd5cf; padding: .42rem .6rem; text-align: left; vertical-align: top; }
th { background: #e8f1ec; color: #0d2b1c; }
tr:nth-child(even) td { background: #fafcfb; }
hr { border: 0; border-top: 1px solid #cfd8d2; margin: 2rem 0; }
ul, ol { padding-left: 1.5rem; }
li { margin: .18rem 0; }
"""

INLINE_CODE = re.compile(r"`([^`]+)`")
BOLD = re.compile(r"\*\*(.+?)\*\*")
ITALIC = re.compile(r"(?<!\*)\*([^*\n]+?)\*(?!\*)")
LINK = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")
TABLE_DELIM = re.compile(r"^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$")
FENCE = re.compile(r"^\s*(```+|~~~+)\s*([\w+-]*)\s*$")
HEADING = re.compile(r"^(#{1,6})\s+(.*?)\s*#*\s*$")
ULIST = re.compile(r"^\s*[-*+]\s+(.*)$")
OLIST = re.compile(r"^\s*\d+[.)]\s+(.*)$")
HR = re.compile(r"^\s*([-*_])(\s*\1){2,}\s*$")


def inline(text: str) -> str:
    """Escape ``text`` and apply inline Markdown, protecting code spans first."""
    spans: list[str] = []

    def stash(match: re.Match[str]) -> str:
        spans.append(html.escape(match.group(1)))
        return f"\x00{len(spans) - 1}\x00"

    text = INLINE_CODE.sub(stash, text)
    text = html.escape(text)
    text = LINK.sub(lambda m: f'<a href="{html.escape(m.group(2), quote=True)}">{m.group(1)}</a>', text)
    text = BOLD.sub(r"<strong>\1</strong>", text)
    text = ITALIC.sub(r"<em>\1</em>", text)
    return re.sub(r"\x00(\d+)\x00", lambda m: f"<code>{spans[int(m.group(1))]}</code>", text)


def split_row(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def convert(markdown: str) -> str:
    """Convert GitHub-flavoured Markdown to an HTML fragment."""
    lines = markdown.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    out: list[str] = []
    index = 0
    total = len(lines)

    while index < total:
        line = lines[index]

        fence = FENCE.match(line)
        if fence:
            marker, language = fence.group(1), fence.group(2)
            index += 1
            block: list[str] = []
            while index < total and not FENCE.match(lines[index]):
                block.append(lines[index])
                index += 1
            index += 1  # consume the closing fence
            css = f' class="language-{html.escape(language)}"' if language else ""
            out.append(f"<pre><code{css}>{html.escape(chr(10).join(block))}</code></pre>")
            continue

        if not line.strip():
            index += 1
            continue

        if HR.match(line):
            out.append("<hr />")
            index += 1
            continue

        heading = HEADING.match(line)
        if heading:
            level = len(heading.group(1))
            out.append(f"<h{level}>{inline(heading.group(2))}</h{level}>")
            index += 1
            continue

        # Table: a header row followed by a delimiter row.
        if "|" in line and index + 1 < total and TABLE_DELIM.match(lines[index + 1]):
            headers = split_row(line)
            index += 2
            rows: list[list[str]] = []
            while index < total and "|" in lines[index] and lines[index].strip():
                rows.append(split_row(lines[index]))
                index += 1
            head = "".join(f"<th>{inline(c)}</th>" for c in headers)
            body = "".join(
                "<tr>" + "".join(f"<td>{inline(c)}</td>" for c in row) + "</tr>" for row in rows
            )
            out.append(f"<table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>")
            continue

        if line.lstrip().startswith(">"):
            block = []
            while index < total and lines[index].lstrip().startswith(">"):
                block.append(lines[index].lstrip()[1:].strip())
                index += 1
            out.append(f"<blockquote><p>{inline(' '.join(block))}</p></blockquote>")
            continue

        if ULIST.match(line) or OLIST.match(line):
            ordered = bool(OLIST.match(line))
            tag = "ol" if ordered else "ul"
            pattern = OLIST if ordered else ULIST
            items: list[str] = []
            while index < total:
                current = lines[index]
                match = pattern.match(current)
                if not match:
                    break
                parts = [match.group(1).strip()]
                index += 1
                # Lazy continuation: indented or plain lines that belong to this item.
                while index < total and lines[index].strip():
                    nxt = lines[index]
                    if pattern.match(nxt) or FENCE.match(nxt) or HEADING.match(nxt) or HR.match(nxt):
                        break
                    if nxt.lstrip().startswith(">"):
                        break
                    if "|" in nxt and index + 1 < total and TABLE_DELIM.match(lines[index + 1]):
                        break
                    parts.append(nxt.strip())
                    index += 1
                items.append(inline(" ".join(parts)))
                # Skip blank lines between items of the same list.
                look = index
                while look < total and not lines[look].strip():
                    look += 1
                if look < total and pattern.match(lines[look]):
                    index = look
                    continue
                break
            out.append(f"<{tag}>" + "".join(f"<li>{item}</li>" for item in items) + f"</{tag}>")
            continue

        # Paragraph: gather until a blank line or a new block starts.
        block = [line]
        index += 1
        while index < total:
            nxt = lines[index]
            if not nxt.strip() or FENCE.match(nxt) or HEADING.match(nxt) or HR.match(nxt):
                break
            if ULIST.match(nxt) or OLIST.match(nxt) or nxt.lstrip().startswith(">"):
                break
            block.append(nxt)
            index += 1
        out.append("<p>" + "<br />".join(inline(part) for part in block) + "</p>")

    return "\n".join(out)


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("usage: md_to_html.py INPUT.md OUTPUT.html", file=sys.stderr)
        return 2
    src, dst = Path(argv[1]), Path(argv[2])
    body = convert(src.read_text(encoding="utf-8"))
    title = html.escape(src.stem)
    document = (
        "<!DOCTYPE html>\n"
        '<html lang="en">\n<head>\n<meta charset="utf-8" />\n'
        f"<title>{title}</title>\n<style>{CSS}</style>\n</head>\n<body>\n{body}\n</body>\n</html>\n"
    )
    dst.write_text(document, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
