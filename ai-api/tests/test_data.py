from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from app.data import DatasetError, MemberStore, fingerprint_file, load_members


def test_sample_dataset_loads_every_approved_member(sample_path: Path, members: list[dict]) -> None:
    store = MemberStore(sample_path)
    assert store.count == len(members) == 4
    assert store.directory()[0].keys() == {
        "id",
        "fullName",
        "aliases",
        "githubUsername",
        "role",
        "skills",
        "targetUser",
        "feature",
    }


def test_fingerprint_is_sha256_of_the_file(sample_path: Path) -> None:
    expected = hashlib.sha256(sample_path.read_bytes()).hexdigest()
    assert fingerprint_file(sample_path) == expected
    assert MemberStore(sample_path).fingerprint == expected


def test_empty_dataset_is_valid_for_startup(tmp_path: Path) -> None:
    path = tmp_path / "members.json"
    path.write_text("[]", encoding="utf-8")
    store = MemberStore(path)
    assert store.count == 0
    assert store.directory() == []


def test_missing_required_key_is_rejected(tmp_path: Path, members: list[dict]) -> None:
    broken = [dict(members[0])]
    del broken[0]["introductionDraft"]
    path = tmp_path / "members.json"
    path.write_text(json.dumps(broken), encoding="utf-8")
    with pytest.raises(DatasetError, match="introductionDraft"):
        load_members(path)


def test_duplicate_member_id_is_rejected(tmp_path: Path, members: list[dict]) -> None:
    broken = [dict(members[0]), dict(members[1])]
    broken[1]["id"] = broken[0]["id"]
    path = tmp_path / "members.json"
    path.write_text(json.dumps(broken), encoding="utf-8")
    with pytest.raises(DatasetError, match="duplicate id"):
        load_members(path)


def test_phone_number_is_rejected_for_privacy(tmp_path: Path, members: list[dict]) -> None:
    broken = [dict(members[0])]
    broken[0]["introductionDraft"] = "Call me on 0788123456 for the demo."
    path = tmp_path / "members.json"
    path.write_text(json.dumps(broken), encoding="utf-8")
    with pytest.raises(DatasetError, match="phone-number-like"):
        load_members(path)


def test_secret_like_value_is_rejected(tmp_path: Path, members: list[dict]) -> None:
    broken = [dict(members[0])]
    broken[0]["contribution"] = "Deployed with api_key=supersecret123 and finished."
    path = tmp_path / "members.json"
    path.write_text(json.dumps(broken), encoding="utf-8")
    with pytest.raises(DatasetError, match="secret-like"):
        load_members(path)


def test_optional_empty_fields_do_not_remove_a_member(tmp_path: Path, members: list[dict]) -> None:
    adjusted = [dict(member) for member in members]
    adjusted[0]["personalClipUrl"] = ""
    adjusted[0]["demoTimestamp"] = ""
    adjusted[0]["testerFeedback"] = []
    path = tmp_path / "members.json"
    path.write_text(json.dumps(adjusted), encoding="utf-8")
    store = MemberStore(path)
    assert store.count == 4
    assert store.get("aline-uwase") is not None


def test_dataset_must_be_a_json_array(tmp_path: Path) -> None:
    path = tmp_path / "members.json"
    path.write_text('{"members": []}', encoding="utf-8")
    with pytest.raises(DatasetError, match="JSON array"):
        load_members(path)
