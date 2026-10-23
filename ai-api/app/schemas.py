"""Pydantic contracts for the public API and the approved member dataset."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .config import MAX_QUERY_LENGTH


def _require_https(value: str) -> str:
    if value and not value.startswith(("https://", "http://")):
        raise ValueError("URL must start with https:// or http://")
    return value


class EvidenceLink(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str = Field(min_length=1, max_length=200)
    url: str = Field(min_length=1, max_length=500)
    type: str = Field(default="artifact", max_length=50)

    _validate_url = field_validator("url")(_require_https)


class TesterFeedback(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category: str = Field(min_length=1, max_length=120)
    quote: str = Field(min_length=1, max_length=500)
    consent: bool
    name: str | None = Field(default=None, max_length=120)


class MemberProfile(BaseModel):
    """One complete approved record. Optional evidence fields may be empty."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9-]+$")
    fullName: str = Field(min_length=2, max_length=120)
    registrationNumber: str = Field(min_length=2, max_length=40)
    aliases: list[str] = Field(default_factory=list)
    githubUsername: str = Field(min_length=1, max_length=80)
    role: str = Field(min_length=2, max_length=120)
    skills: list[str] = Field(default_factory=list, min_length=1)
    targetUser: str = Field(min_length=2, max_length=500)
    problem: str = Field(min_length=2, max_length=800)
    contribution: str = Field(min_length=2, max_length=1500)
    feature: str = Field(min_length=2, max_length=200)
    outcomeMetric: str = Field(min_length=2, max_length=800)
    evidenceLinks: list[EvidenceLink] = Field(min_length=1)
    testerFeedback: list[TesterFeedback] = Field(default_factory=list)
    introductionDraft: str = Field(min_length=2, max_length=1500)
    issueUrl: str | None = None
    branchName: str | None = Field(default=None, max_length=120)
    pullRequestUrl: str | None = None
    reviewedCommitUrl: str | None = None
    mergedCommitUrl: str | None = None
    reviewedPullRequestUrl: str | None = None
    demoVideoUrl: str | None = None
    demoTimestamp: str | None = Field(default=None, max_length=20)
    personalClipUrl: str | None = None

    @field_validator(
        "issueUrl",
        "pullRequestUrl",
        "reviewedCommitUrl",
        "mergedCommitUrl",
        "reviewedPullRequestUrl",
        "demoVideoUrl",
        "personalClipUrl",
    )
    @classmethod
    def validate_optional_urls(cls, value: str | None) -> str | None:
        if value:
            _require_https(value)
        return value


class DirectoryMember(BaseModel):
    """Fields safe to bundle on the phone for manual browsing and offline lookup."""

    model_config = ConfigDict(extra="forbid")

    id: str
    fullName: str
    aliases: list[str]
    githubUsername: str
    role: str
    skills: list[str]
    targetUser: str
    feature: str


class AskRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    query: str = Field(min_length=1, max_length=MAX_QUERY_LENGTH)

    @field_validator("query")
    @classmethod
    def query_must_contain_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Question must not be empty or only spaces.")
        return cleaned


class AskMatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    fullName: str
    registrationNumber: str
    aliases: list[str]
    githubUsername: str
    role: str
    skills: list[str]
    targetUser: str
    problem: str
    contribution: str
    feature: str
    outcomeMetric: str
    evidenceLinks: list[EvidenceLink]
    testerFeedback: list[TesterFeedback]
    introductionDraft: str
    issueUrl: str | None = None
    branchName: str | None = None
    pullRequestUrl: str | None = None
    reviewedCommitUrl: str | None = None
    mergedCommitUrl: str | None = None
    reviewedPullRequestUrl: str | None = None
    demoVideoUrl: str | None = None
    demoTimestamp: str | None = None
    personalClipUrl: str | None = None


class Suggestion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str
    kind: Literal["name", "role", "feature"]


class Candidate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    fullName: str
    confidence: float


class AskResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    query: str
    groupCode: str
    modelVersion: str
    threshold: float
    datasetFingerprint: str
    match: AskMatch | None
    confidence: float
    reason: str
    matchedTerms: list[str]
    introduction: str | None
    evidenceLinks: list[EvidenceLink]
    source: Literal["live"] = "live"
    suggestions: list[Suggestion]
    topCandidates: list[Candidate]


class HealthResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["ok", "degraded"]
    version: str
    groupCode: str
    modelVersion: str
    memberCount: int
    datasetFingerprint: str
    dataSource: str


class EvaluationSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    top1Accuracy: float
    noMatchRejectionAccuracy: float
    queryCount: int
    memberQueryCount: int
    noMatchQueryCount: int
    threshold: float
    generatedAt: str | None = None
    errorCount: int = 0


class ModelInfoResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    groupCode: str
    modelVersion: str
    vectorizerType: str
    features: str
    similarity: str
    confidenceMethod: str
    threshold: float
    aliasBoost: str
    datasetFingerprint: str
    memberCount: int
    buildCommit: str
    builtAt: str
    limitations: list[str]
    evaluation: EvaluationSummary | None = None
