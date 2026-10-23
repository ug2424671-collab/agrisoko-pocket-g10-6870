from __future__ import annotations

import copy

import pytest

from app.engine import EXACT_IDENTITY_SCORE, MatchingEngine


def test_exact_name_returns_member_and_explains_boost(engine: MatchingEngine) -> None:
    result = engine.match("Tell me about Aline")
    assert result["match"]["id"] == "aline-uwase"
    assert result["confidence"] == pytest.approx(EXACT_IDENTITY_SCORE)
    assert result["boost"] == "exact_name_or_alias"
    assert "Exact name or alias" in result["reason"]


def test_nickname_not_in_full_name_is_found(engine: MatchingEngine) -> None:
    result = engine.match("Tell me about Ricky")
    assert result["match"]["id"] == "eric-niyonzima"
    assert result["boost"] == "exact_name_or_alias"


def test_role_query_returns_owner(engine: MatchingEngine) -> None:
    result = engine.match("Who is the AI and data engineer?")
    assert result["match"]["id"] == "aline-uwase"
    assert result["confidence"] >= 0.45
    assert "engineer" in result["reason"].lower() or "data" in result["reason"].lower()


def test_feature_query_returns_owner(engine: MatchingEngine) -> None:
    result = engine.match("Who implemented offline lookup with AsyncStorage?")
    assert result["match"]["id"] == "samuel-habimana"


def test_vague_question_is_rejected(engine: MatchingEngine) -> None:
    result = engine.match("Who won the 2026 World Cup?")
    assert result["match"] is None
    assert result["confidence"] < 0.45
    assert "threshold" in result["reason"]
    assert result["suggestions"]


@pytest.mark.parametrize(
    "query",
    [
        "Who won the 2026 World Cup?",
        "What is the potato price tomorrow?",
        "Who is the president of Rwanda?",
        "Who built the payment system?",
        "Help",
    ],
)
def test_deliberate_no_match_queries(engine: MatchingEngine, query: str) -> None:
    assert engine.match(query)["match"] is None


def test_empty_dataset_returns_safe_no_match() -> None:
    result = MatchingEngine([], threshold=0.45).match("Tell me about Aline")
    assert result["match"] is None
    assert result["confidence"] == 0.0
    assert "No approved member dataset" in result["reason"]


def test_ambiguous_alias_returns_no_match(members: list[dict]) -> None:
    first = copy.deepcopy(members[0])
    second = copy.deepcopy(members[1])
    first["aliases"] = ["Alex"]
    second["aliases"] = ["Alex"]
    result = MatchingEngine([first, second], threshold=0.45).match("Alex")
    assert result["match"] is None
    assert "ambiguous" in result["reason"].lower()


def test_introduction_comes_from_approved_record(engine: MatchingEngine, members: list[dict]) -> None:
    result = engine.match("Eric")
    approved = next(member["introductionDraft"] for member in members if member["id"] == result["match"]["id"])
    assert result["match"]["introductionDraft"] == approved


def test_top_candidates_are_ranked(engine: MatchingEngine) -> None:
    result = engine.match("mobile engineer")
    scores = [candidate["confidence"] for candidate in result["top_candidates"]]
    assert scores == sorted(scores, reverse=True)
    assert 0 < len(scores) <= 3
