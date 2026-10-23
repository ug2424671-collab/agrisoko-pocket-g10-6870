"""Load, validate and fingerprint the approved member dataset.

The loader is intentionally strict about missing required keys and privacy
leaks. Optional fields (a demo clip, a personal timestamp) may be empty without
removing the member from the index.
"""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

from pydantic import ValidationError

from .schemas import DirectoryMember, MemberProfile

PHONE_PATTERN = re.compile(r"(?<!\d)(?:\+?250|0)?7[2389]\d{7}(?!\d)")
SECRET_PATTERN = re.compile(
    r"(password\s*[:=]|api[_-]?key\s*[:=]|access[_-]?token\s*[:=]|secret\s*[:=]|ghp_[A-Za-z0-9]{20,})",
    re.IGNORECASE,
)

DIRECTORY_FIELDS = (
    "id",
    "fullName",
    "aliases",
    "githubUsername",
    "role",
    "skills",
    "targetUser",
    "feature",
)


class DatasetError(ValueError):
    """Raised when members.json cannot be trusted as an approved dataset."""


def fingerprint_file(path: Path | str) -> str:
    path = Path(path)
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def fingerprint_members(members: list[dict[str, Any]]) -> str:
    canonical = json.dumps(members, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _privacy_findings(record: dict[str, Any]) -> list[str]:
    findings: list[str] = []
    for key, value in record.items():
        values: list[str] = []
        if isinstance(value, str):
            values = [value]
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, str):
                    values.append(item)
                elif isinstance(item, dict):
                    values.extend(str(part) for part in item.values() if isinstance(part, str))
        for text in values:
            if PHONE_PATTERN.search(text):
                findings.append(f"{key}: phone-number-like value")
            if SECRET_PATTERN.search(text):
                findings.append(f"{key}: secret-like value")
    return findings


def load_members(path: Path, *, allow_empty: bool = True) -> list[dict[str, Any]]:
    if not path.exists():
        raise DatasetError(f"Dataset not found: {path}")
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise DatasetError(f"members.json is not valid JSON: {exc}") from exc
    if not isinstance(raw, list):
        raise DatasetError("members.json must contain a JSON array of member records.")
    if not raw and not allow_empty:
        raise DatasetError("members.json is empty; at least one member is required for release.")

    validated: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    problems: list[str] = []
    for position, record in enumerate(raw, start=1):
        if not isinstance(record, dict):
            problems.append(f"record {position}: expected an object")
            continue
        try:
            profile = MemberProfile.model_validate(record)
        except ValidationError as exc:
            problems.append(f"record {position} ({record.get('fullName', 'unknown')}): {exc.errors()}")
            continue
        if profile.id in seen_ids:
            problems.append(f"record {position}: duplicate id '{profile.id}'")
            continue
        seen_ids.add(profile.id)
        privacy = _privacy_findings(record)
        if privacy:
            problems.append(f"record {position} ({profile.fullName}): {', '.join(privacy)}")
            continue
        validated.append(profile.model_dump(mode="json"))

    if problems:
        raise DatasetError("Dataset validation failed:\n- " + "\n- ".join(problems))
    return validated


def directory_payload(members: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        DirectoryMember.model_validate({key: member[key] for key in DIRECTORY_FIELDS}).model_dump(mode="json")
        for member in members
    ]


def search_document(member: dict[str, Any]) -> str:
    """One searchable document per member, built only from approved fields."""
    return " ".join(
        [
            member["fullName"],
            " ".join(member.get("aliases") or []),
            member["role"],
            " ".join(member.get("skills") or []),
            member["feature"],
            member.get("problem") or "",
            member.get("contribution") or "",
            member.get("targetUser") or "",
            member.get("outcomeMetric") or "",
        ]
    )


class MemberStore:
    """In-memory approved dataset with a stable SHA-256 fingerprint."""

    def __init__(self, path: Path | str):
        self.path = Path(path)
        self.members = load_members(self.path)
        self.fingerprint = fingerprint_file(path)
        self.by_id = {member["id"]: member for member in self.members}

    @property
    def count(self) -> int:
        return len(self.members)

    def get(self, member_id: str) -> dict[str, Any] | None:
        return self.by_id.get(member_id)

    def directory(self) -> list[dict[str, Any]]:
        return directory_payload(self.members)
