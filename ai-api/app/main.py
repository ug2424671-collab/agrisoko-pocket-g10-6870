"""AgriSoko Pocket AI service: grounded member matching over approved records."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import (
    API_VERSION,
    ARTIFACTS_DIR,
    BUILD_COMMIT,
    DATA_FILE,
    DEFAULT_THRESHOLD,
    EVALUATION_FILE,
    GROUP_CODE,
    MAX_QUERY_LENGTH,
    MODEL_VERSION,
)
from .data import MemberStore
from .engine import MatchingEngine, empty_metadata
from .schemas import (
    AskMatch,
    AskRequest,
    AskResponse,
    DirectoryMember,
    EvaluationSummary,
    HealthResponse,
    MemberProfile,
    ModelInfoResponse,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("agrisoko.api")


def _evaluation_summary(path: Path) -> EvaluationSummary | None:
    if not path.exists():
        return None
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        return EvaluationSummary(
            top1Accuracy=float(payload["top1Accuracy"]),
            noMatchRejectionAccuracy=float(payload["noMatchRejectionAccuracy"]),
            queryCount=int(payload["queryCount"]),
            memberQueryCount=int(payload["memberQueryCount"]),
            noMatchQueryCount=int(payload["noMatchQueryCount"]),
            threshold=float(payload["threshold"]),
            generatedAt=payload.get("generatedAt"),
            errorCount=int(payload.get("errorCount", 0)),
        )
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        logger.warning("Could not read evaluation summary: %s", exc)
        return None


def create_app(*, data_file: Path | None = None, threshold: float | None = None) -> FastAPI:
    store = MemberStore(data_file or DATA_FILE)
    active_threshold = DEFAULT_THRESHOLD if threshold is None else threshold
    engine = MatchingEngine(store.members, threshold=active_threshold)
    metadata = engine.metadata(build_commit=BUILD_COMMIT, fingerprint=store.fingerprint)

    app = FastAPI(
        title="AgriSoko Pocket AI",
        description="Deterministic, evidence-grounded member profile finder.",
        version=API_VERSION,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )
    app.state.store = store
    app.state.engine = engine
    app.state.threshold = active_threshold

    @app.exception_handler(Exception)
    async def safe_server_error(_request, exc: Exception):  # type: ignore[no-untyped-def]
        logger.exception("Unhandled server error: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "The profile service failed safely. Please retry."},
        )

    @app.get("/", include_in_schema=False)
    def root() -> dict[str, Any]:
        return {
            "service": "AgriSoko Pocket AI",
            "groupCode": GROUP_CODE,
            "docs": "/docs",
            "health": "/health",
        }

    @app.get("/health", response_model=HealthResponse)
    def health() -> HealthResponse:
        return HealthResponse(
            status="ok" if store.count else "degraded",
            version=API_VERSION,
            groupCode=GROUP_CODE,
            modelVersion=MODEL_VERSION,
            memberCount=store.count,
            datasetFingerprint=store.fingerprint,
            dataSource=str(store.path),
        )

    @app.get("/members", response_model=list[DirectoryMember])
    def members() -> list[dict[str, Any]]:
        return store.directory()

    @app.get("/members/{member_id}", response_model=MemberProfile)
    def member(member_id: str) -> dict[str, Any]:
        record = store.get(member_id)
        if record is None:
            raise HTTPException(status_code=404, detail=f"No approved member with id '{member_id}'.")
        return record

    @app.post("/ask", response_model=AskResponse)
    def ask(payload: AskRequest) -> AskResponse:
        if store.count == 0:
            raise HTTPException(
                status_code=503,
                detail="No approved member dataset is loaded, so the question cannot be answered.",
            )

        result = engine.match(payload.query)
        member = result["match"]
        match_payload = AskMatch.model_validate(member) if member else None
        introduction = member["introductionDraft"] if member else None
        evidence_links = member["evidenceLinks"] if member else []

        logger.info(
            "ask query_length=%s matched=%s confidence=%.2f",
            len(payload.query),
            member["id"] if member else "none",
            result["confidence"],
        )

        return AskResponse(
            query=payload.query,
            groupCode=GROUP_CODE,
            modelVersion=MODEL_VERSION,
            threshold=active_threshold,
            datasetFingerprint=store.fingerprint,
            match=match_payload,
            confidence=result["confidence"],
            reason=result["reason"],
            matchedTerms=result["matched_terms"],
            introduction=introduction,
            evidenceLinks=evidence_links,
            suggestions=result["suggestions"],
            topCandidates=result["top_candidates"],
        )

    @app.get("/model-info", response_model=ModelInfoResponse)
    def model_info() -> ModelInfoResponse:
        evaluation = _evaluation_summary(EVALUATION_FILE)
        base = metadata if store.count else empty_metadata(
            build_commit=BUILD_COMMIT,
            fingerprint=store.fingerprint,
            threshold=active_threshold,
        )
        return ModelInfoResponse(
            groupCode=GROUP_CODE,
            modelVersion=MODEL_VERSION,
            vectorizerType=base["vectorizerType"],
            features=base["features"],
            similarity=base["similarity"],
            confidenceMethod=base["confidenceMethod"],
            threshold=active_threshold,
            aliasBoost=base["aliasBoost"],
            datasetFingerprint=store.fingerprint,
            memberCount=store.count,
            buildCommit=BUILD_COMMIT,
            builtAt=datetime.now(timezone.utc).isoformat(timespec="seconds"),
            limitations=base["limitations"],
            evaluation=evaluation,
        )

    return app


app = create_app()


__all__ = ["app", "create_app", "MAX_QUERY_LENGTH", "ARTIFACTS_DIR"]
