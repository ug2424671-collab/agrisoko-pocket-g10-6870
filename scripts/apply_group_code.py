#!/usr/bin/env python3
"""Replace the group-code and repository placeholders across the project.

The brief assigns each group a code such as ``G14``. Until that code is known the
project uses the placeholder ``GXX`` in the app name, the Android package, the
API configuration and the documentation. This script performs the substitution in
one auditable pass so no placeholder is missed and no file is edited by hand.

Usage
-----
    python scripts/apply_group_code.py --group-code G14
    python scripts/apply_group_code.py --group-code G14 --dry-run
    python scripts/apply_group_code.py --group-code G14 \
        --repo-url https://github.com/my-org/agrisoko-pocket-gxx

What it changes
---------------
* every literal ``GXX`` becomes the real code (upper case) in names and paths
* ``agrisoko-pocket-gxx`` / ``AgriSokoPocket_GXX`` style tokens are rebuilt from
  the code, so file names such as ``COMBO_A3_G14_REPORT.md`` come out right
* an optional ``--repo-url`` replaces the placeholder repository URL

The script is idempotent: running it twice with the same code changes nothing the
second time. It never touches ``node_modules``, virtual environments, caches,
``.git`` or binary files.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

PLACEHOLDER_CODE = "GXX"
PLACEHOLDER_ORG_URL = "https://github.com/REPLACE-ORG/agrisoko-pocket-gxx"

# Android package names, Expo slugs and npm package names only allow lowercase
# letters, digits and single hyphens or underscores. A lecturer code such as
# "G-10-6870" is not safe verbatim, so identifiers use a stripped form.
IDENTIFIER_SAFE_RE = re.compile(r"[^a-z0-9]+")

TEXT_SUFFIXES = {
    ".md", ".py", ".ts", ".tsx", ".js", ".jsx", ".json", ".jsonc",
    ".txt", ".yml", ".yaml", ".toml", ".ini", ".cfg", ".sh", ".env",
    ".example", ".html", ".css",
}

SKIP_DIRS = {
    ".git", "node_modules", ".venv", "venv", "build", "dist",
    "__pycache__", ".pytest_cache", ".mypy_cache", ".expo", ".expo-shared",
}

SKIP_FILES = {"package-lock.json", "apply_group_code.py"}


def is_text_candidate(path: Path) -> bool:
    if path.name in SKIP_FILES:
        return False
    if path.suffix in TEXT_SUFFIXES:
        return True
    return path.name in {".gitignore", ".env.example", ".npmrc"}


def iter_files(root: Path):
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.relative_to(root).parts):
            continue
        if is_text_candidate(path):
            yield path


def replacements(code: str, repo_url: str | None) -> list[tuple[str, str]]:
    """Return ordered (search, replace) pairs, longest placeholders first."""
    lower = identifier_form(code)
    pairs = [
        (PLACEHOLDER_ORG_URL, (repo_url or PLACEHOLDER_ORG_URL).rstrip("/")),
        ("https://github.com/REPLACE-ORG/", (repo_url or PLACEHOLDER_ORG_URL).rstrip("/")),
        ("REPLACE-ORG", _org_from(repo_url) if repo_url else "REPLACE-ORG"),
        ("AgriSokoPocket_GXX", f"AgriSokoPocket_{code}"),
        ("AgriSokoPocket_Gxx", f"AgriSokoPocket_{code}"),
        ("agrisoko-pocket-gxx", f"agrisoko-pocket-{lower}"),
        ("agrisoko.pocket.gxx", f"agrisoko.pocket.{lower}"),
        ("AgriSoko Pocket GXX", f"AgriSoko Pocket {code}"),
        (PLACEHOLDER_CODE, code),
    ]
    return pairs


def identifier_form(code: str) -> str:
    """Return a package/slug-safe lowercase form of a group code.

    ``G-10-6870`` becomes ``g106870`` so it is valid in an Android package name.
    """
    return IDENTIFIER_SAFE_RE.sub("", code.lower())


def _org_from(repo_url: str | None) -> str:
    """Extract the owner segment from a repository URL, if there is one."""
    if not repo_url:
        return "REPLACE-ORG"
    match = re.search(r"github\.com/([^/]+)/", repo_url)
    return match.group(1) if match else "REPLACE-ORG"


def rename_paths(root: Path, code: str, dry_run: bool) -> list[tuple[Path, Path]]:
    """Rename files whose names contain the placeholder (deepest path first)."""
    lower = identifier_form(code)
    renamed: list[tuple[Path, Path]] = []
    candidates = [
        path for path in root.rglob("*")
        if path.is_file()
        and any(part not in SKIP_DIRS for part in path.relative_to(root).parts)
        and PLAEHOLDER_RE.search(path.name)
    ]
    for path in sorted(candidates, key=lambda p: len(p.parts), reverse=True):
        new_name = PLAEHOLDER_RE.sub(lambda m: _rename_token(m.group(0), code, lower), path.name)
        target = path.with_name(new_name)
        renamed.append((path, target))
        if not dry_run:
            path.rename(target)
    return renamed


PLAEHOLDER_RE = re.compile(r"GXX|Gxx|gxx")


def _rename_token(token: str, code: str, lower: str) -> str:
    if token == "gxx":
        return lower
    return code


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--group-code", required=True, help="lecturer-assigned code, for example G14")
    parser.add_argument("--repo-url", default=None, help="real repository URL (optional)")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--dry-run", action="store_true", help="report changes without writing")
    args = parser.parse_args(argv)

    code = args.group_code.strip().upper()
    # Accept formats such as G14, G-10-6870 or G_4. Reject anything with
    # characters that cannot appear in a filename or an identifier.
    if not re.fullmatch(r"[A-Z0-9][A-Z0-9._-]{0,23}", code):
        print(
            f"error: '{args.group_code}' is not a usable group code "
            "(letters, digits, dot, underscore or hyphen, max 24 characters)",
            file=sys.stderr,
        )
        return 2
    if not identifier_form(code):
        print(f"error: '{args.group_code}' has no letters or digits to build an identifier from", file=sys.stderr)
        return 2
    if code == PLACEHOLDER_CODE:
        print("error: that is still the placeholder code", file=sys.stderr)
        return 2

    root = args.root.resolve()
    pairs = replacements(code, args.repo_url)
    changed: list[tuple[Path, int]] = []

    for path in iter_files(root):
        try:
            original = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        updated = original
        for search, replace in pairs:
            if search in updated:
                updated = updated.replace(search, replace)
        if updated == original:
            continue
        count = sum(original.count(search) for search, _ in pairs)
        changed.append((path.relative_to(root), count))
        if not args.dry_run:
            path.write_text(updated, encoding="utf-8")

    label = "would change" if args.dry_run else "changed"
    for rel, count in changed:
        print(f"{label:>12}  {rel}  ({count} replacement{'s' if count != 1 else ''})")

    renamed = rename_paths(root, code, args.dry_run)
    for src, dst in renamed:
        verb = "would rename" if args.dry_run else "renamed"
        print(f"{verb:>12}  {src.relative_to(root)}  ->  {dst.name}")

    print(f"\n{len(changed)} file(s) {label}, {len(renamed)} file(s) renamed. Group code: {code}")
    if args.dry_run:
        print("dry run: nothing was written")
    elif changed:
        print("\nNext steps:")
        print("  1. python ai-api/scripts/validate_data.py")
        print("  2. python ai-api/scripts/build_index.py")
        print("  3. python ai-api/scripts/evaluate.py")
        print("  4. python ai-api/scripts/sync_mobile_data.py")
        print("  5. cd mobile && npm run check")
        print("  6. re-run docs/make_pdfs.sh to refresh the PDFs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
