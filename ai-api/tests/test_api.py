from __future__ import annotations

from fastapi.testclient import TestClient


def test_health_contract(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["groupCode"] == "GXX"
    assert body["memberCount"] == 4
    assert len(body["datasetFingerprint"]) == 64


def test_members_directory_is_safe(client: TestClient) -> None:
    response = client.get("/members")
    assert response.status_code == 200
    members = response.json()
    assert len(members) == 4
    assert {"id", "fullName", "aliases", "githubUsername", "role", "skills", "targetUser", "feature"} == set(members[0])
    assert "registrationNumber" not in members[0]
    assert "testerFeedback" not in members[0]


def test_single_member_profile(client: TestClient) -> None:
    response = client.get("/members/eric-niyonzima")
    assert response.status_code == 200
    body = response.json()
    assert body["fullName"] == "Eric Niyonzima"
    assert body["registrationNumber"].startswith("UG")
    assert body["evidenceLinks"]


def test_unknown_member_returns_404(client: TestClient) -> None:
    response = client.get("/members/not-a-member")
    assert response.status_code == 404
    assert "No approved member" in response.json()["detail"]


def test_ask_returns_grounded_contract(client: TestClient) -> None:
    response = client.post("/ask", json={"query": "Tell me about Aline"})
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
        "query",
        "groupCode",
        "modelVersion",
        "threshold",
        "datasetFingerprint",
        "match",
        "confidence",
        "reason",
        "matchedTerms",
        "introduction",
        "evidenceLinks",
        "source",
        "suggestions",
        "topCandidates",
    }
    assert body["match"]["id"] == "aline-uwase"
    assert body["confidence"] >= body["threshold"]
    assert body["source"] == "live"
    assert body["groupCode"] == "GXX"
    assert body["introduction"] == body["match"]["introductionDraft"]
    assert body["evidenceLinks"][0]["url"].startswith("https://")


def test_ask_no_match_is_safe(client: TestClient) -> None:
    response = client.post("/ask", json={"query": "Who is the president of Rwanda?"})
    assert response.status_code == 200
    body = response.json()
    assert body["match"] is None
    assert body["introduction"] is None
    assert body["evidenceLinks"] == []
    assert body["confidence"] < body["threshold"]
    assert body["suggestions"]


def test_ask_rejects_empty_question(client: TestClient) -> None:
    assert client.post("/ask", json={"query": ""}).status_code == 422
    assert client.post("/ask", json={"query": "   "}).status_code == 422


def test_ask_rejects_missing_question(client: TestClient) -> None:
    assert client.post("/ask", json={}).status_code == 422


def test_ask_rejects_overlong_question(client: TestClient) -> None:
    assert client.post("/ask", json={"query": "a" * 301}).status_code == 422


def test_ask_rejects_extra_fields(client: TestClient) -> None:
    assert client.post("/ask", json={"query": "Aline", "role": "admin"}).status_code == 422


def test_model_info_contract(client: TestClient) -> None:
    response = client.get("/model-info")
    assert response.status_code == 200
    body = response.json()
    assert body["modelVersion"] == "agrisoko-tfidf-v1"
    assert body["threshold"] == 0.45
    assert body["memberCount"] == 4
    assert "char_wb" in body["vectorizerType"]
    assert body["limitations"]
    assert len(body["datasetFingerprint"]) == 64


def test_empty_dataset_returns_degraded_health(empty_client: TestClient) -> None:
    body = empty_client.get("/health").json()
    assert body["status"] == "degraded"
    assert body["memberCount"] == 0
    assert empty_client.get("/members").json() == []


def test_empty_dataset_ask_returns_503(empty_client: TestClient) -> None:
    response = empty_client.post("/ask", json={"query": "Tell me about Aline"})
    assert response.status_code == 503
    assert "No approved member dataset" in response.json()["detail"]


def test_empty_dataset_model_info(empty_client: TestClient) -> None:
    body = empty_client.get("/model-info").json()
    assert body["memberCount"] == 0
    assert "not fitted" in body["vectorizerType"].lower()
