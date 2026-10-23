"""Text normalisation shared by the index, the matcher and the tests."""

from __future__ import annotations

import re
import unicodedata

# Words that carry no member signal and would otherwise inflate the reason text.
STOPWORDS = {
    "a",
    "about",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "built",
    "by",
    "can",
    "did",
    "do",
    "does",
    "for",
    "from",
    "give",
    "has",
    "have",
    "he",
    "her",
    "him",
    "his",
    "i",
    "in",
    "is",
    "it",
    "me",
    "member",
    "my",
    "of",
    "on",
    "or",
    "our",
    "please",
    "she",
    "show",
    "tell",
    "that",
    "the",
    "their",
    "them",
    "they",
    "this",
    "to",
    "was",
    "we",
    "were",
    "what",
    "which",
    "who",
    "whom",
    "whose",
    "why",
    "with",
    "worked",
    "own",
    "owns",
    "implemented",
    "created",
    "designed",
    "made",
    "makes",
    "uses",
    "using",
    "responsible",
    "handles",
    "handle",
    "works",
    "working",
    "profile",
    "team",
    "agrisoko",
    "pocket",
    "project",
    "app",
    "application",
    "information",
    "details",
    "person",
    "people",
    "student",
    "group",
    "find",
}

_TOKEN_RE = re.compile(r"[a-z0-9]+")


def normalize_text(value: str) -> str:
    """Lowercase, strip accents and collapse every separator to one space."""
    decomposed = unicodedata.normalize("NFKD", value or "")
    without_accents = "".join(char for char in decomposed if not unicodedata.combining(char))
    lowered = without_accents.lower()
    cleaned = re.sub(r"[^a-z0-9]+", " ", lowered)
    return re.sub(r"\s+", " ", cleaned).strip()


def tokenize(value: str) -> list[str]:
    return _TOKEN_RE.findall(normalize_text(value))


def content_tokens(value: str) -> list[str]:
    """Tokens useful for explaining a match, without filler words."""
    return [token for token in tokenize(value) if token not in STOPWORDS and len(token) > 1]


def initials_or_alias_matches(query: str, alias: str) -> bool:
    """True when the alias is the whole query or a whole phrase inside it."""
    query_norm = f" {normalize_text(query)} "
    alias_norm = normalize_text(alias)
    if not alias_norm:
        return False
    return f" {alias_norm} " in query_norm
