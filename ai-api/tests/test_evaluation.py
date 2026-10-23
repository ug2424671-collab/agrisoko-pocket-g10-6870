from __future__ import annotations

from collections import Counter

import pytest

from app.engine import MatchingEngine


def test_query_suite_has_three_queries_per_member_and_five_no_match(queries: list[dict]) -> None:
    member_queries = [row for row in queries if row["expectedMemberId"]]
    no_match = [row for row in queries if not row["expectedMemberId"]]
    assert len(no_match) == 5
    counts = Counter(row["expectedMemberId"] for row in member_queries)
    assert counts == {"aline-uwase": 3, "eric-niyonzima": 3, "claudine-mukamana": 3, "samuel-habimana": 3}


def test_top1_accuracy_and_no_match_rejection(engine: MatchingEngine, queries: list[dict]) -> None:
    member_rows = [row for row in queries if row["expectedMemberId"]]
    no_match_rows = [row for row in queries if not row["expectedMemberId"]]

    correct = 0
    retrieved = 0
    for row in member_rows:
        result = engine.match(row["query"])
        if result["match"] and result["match"]["id"] == row["expectedMemberId"]:
            correct += 1
        if result["top_candidates"] and result["top_candidates"][0]["id"] == row["expectedMemberId"]:
            retrieved += 1

    rejected = sum(1 for row in no_match_rows if engine.match(row["query"])["match"] is None)
    top1 = correct / len(member_rows)
    rejection = rejected / len(no_match_rows)

    assert retrieved / len(member_rows) >= 0.9
    assert top1 >= 0.9, f"top-1 accuracy {top1:.2f} is below the release bar"
    assert rejection == 1.0, f"no-match rejection {rejection:.2f}; unrelated questions must not match"


def test_threshold_is_documented_at_045(engine: MatchingEngine) -> None:
    assert engine.threshold == pytest.approx(0.45)


def test_evaluation_covers_every_member(engine: MatchingEngine, queries: list[dict]) -> None:
    for member_id in {row["expectedMemberId"] for row in queries if row["expectedMemberId"]}:
        assert any(row["expectedMemberId"] == member_id and row["kind"] in {"name", "alias"} for row in queries)
        assert any(row["expectedMemberId"] == member_id and row["kind"] in {"role", "alias"} for row in queries)
        assert any(row["expectedMemberId"] == member_id and row["kind"] == "feature" for row in queries)
