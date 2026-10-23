"""Runtime configuration for the AgriSoko Pocket AI service.

Every value can be overridden with an environment variable so the same build can
run locally, in tests and on the deployed host without editing source code.
"""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = Path(os.getenv("AGRISOKO_DATA_FILE", str(BASE_DIR / "data" / "members.json")))
ARTIFACTS_DIR = Path(os.getenv("AGRISOKO_ARTIFACTS_DIR", str(BASE_DIR / "artifacts")))
EVALUATION_FILE = Path(os.getenv("AGRISOKO_EVALUATION_FILE", str(BASE_DIR / "evaluation" / "results.json")))

GROUP_CODE = os.getenv("AGRISOKO_GROUP_CODE", "GXX")
MODEL_VERSION = "agrisoko-tfidf-v1"
API_VERSION = "1.0.0"
DEFAULT_THRESHOLD = float(os.getenv("AGRISOKO_THRESHOLD", "0.45"))
MAX_QUERY_LENGTH = 300
TOP_K = 3
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("AGRISOKO_ALLOWED_ORIGINS", "*").split(",")
    if origin.strip()
]

LIMITATIONS = [
    "Deterministic lexical retrieval only: it matches words and character fragments, not meaning or synonyms.",
    "A profile can only contain facts approved in ai-api/data/members.json; the service never generates new facts.",
    "Confidence is a TF-IDF cosine score, not a probability that the profile is true.",
    "Very short or vague queries are rejected by the 0.45 threshold instead of guessed.",
    "Offline mode on the phone supports exact name, alias and role lookup only; it does not run TF-IDF.",
]


def _git_commit() -> str:
    """Return the build commit from the environment or the local git checkout."""
    explicit = os.getenv("AGRISOKO_BUILD_COMMIT") or os.getenv("GIT_COMMIT")
    if explicit:
        return explicit
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=BASE_DIR,
            capture_output=True,
            text=True,
            check=False,
            timeout=2,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except (OSError, subprocess.SubprocessError):
        pass
    return "unknown"


BUILD_COMMIT = _git_commit()
