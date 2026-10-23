from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.data import MemberStore  # noqa: E402
from app.engine import MatchingEngine  # noqa: E402
from app.main import create_app  # noqa: E402

SAMPLE_MEMBERS = ROOT / "tests" / "fixtures" / "members.sample.json"
SAMPLE_QUERIES = ROOT / "tests" / "fixtures" / "queries.sample.json"


@pytest.fixture()
def sample_path() -> Path:
    return SAMPLE_MEMBERS


@pytest.fixture()
def members(sample_path: Path) -> list[dict]:
    return json.loads(sample_path.read_text(encoding="utf-8"))


@pytest.fixture()
def store(sample_path: Path) -> MemberStore:
    return MemberStore(sample_path)


@pytest.fixture()
def engine(store: MemberStore) -> MatchingEngine:
    return MatchingEngine(store.members, threshold=0.45)


@pytest.fixture()
def client(sample_path: Path):
    from fastapi.testclient import TestClient

    with TestClient(create_app(data_file=sample_path, threshold=0.45)) as test_client:
        yield test_client


@pytest.fixture()
def empty_client(tmp_path: Path):
    from fastapi.testclient import TestClient

    empty = tmp_path / "members.json"
    empty.write_text("[]\n", encoding="utf-8")
    with TestClient(create_app(data_file=empty, threshold=0.45)) as test_client:
        yield test_client


@pytest.fixture()
def queries() -> list[dict]:
    return json.loads(SAMPLE_QUERIES.read_text(encoding="utf-8"))["queries"]
