"""Deterministic TF-IDF member retrieval.

Design (documented again in GET /model-info):

* One document per approved member, built from name, aliases, role, skills,
  feature, problem, contribution, target user and evidence summary.
* Word features (unigrams + bigrams) combined with character features
  (3-5 character shingles inside word boundaries).
* Cosine similarity, top-1 returned only when the score reaches the threshold.
* An exact full-name or alias phrase is a documented identity boost: the score
  is raised to 0.97. Competing exact identities are treated as ambiguous and
  return no match instead of guessing.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.pipeline import FeatureUnion

from .config import LIMITATIONS, MODEL_VERSION
from .data import search_document
from .normalization import content_tokens, initials_or_alias_matches, normalize_text

EXACT_IDENTITY_SCORE = 0.97
CONFIDENCE_COSINE_WEIGHT = 0.6
CONFIDENCE_COVERAGE_WEIGHT = 0.4
CONFIDENCE_METHOD = (
    "0.6 x TF-IDF cosine similarity + 0.4 x query-term coverage. "
    "Exact full-name/alias matches are raised to 0.97."
)


class MatchingEngine:
    def __init__(self, members: list[dict[str, Any]], *, threshold: float = 0.45):
        self.members = members
        self.threshold = threshold
        self.documents = [search_document(member) for member in members]
        self._identities: list[list[str]] = [
            [member["fullName"], *member.get("aliases", [])] for member in members
        ]
        self.vectorizer: FeatureUnion | None = None
        self.matrix = None
        self.built_at = datetime.now(timezone.utc).isoformat(timespec="seconds")

        if self.documents:
            self.vectorizer = FeatureUnion(
                [
                    (
                        "word",
                        TfidfVectorizer(
                            ngram_range=(1, 2),
                            sublinear_tf=True,
                            strip_accents="unicode",
                            lowercase=True,
                            stop_words="english",
                            min_df=1,
                        ),
                    ),
                    (
                        "char",
                        TfidfVectorizer(
                            analyzer="char_wb",
                            ngram_range=(3, 5),
                            sublinear_tf=True,
                            strip_accents="unicode",
                            lowercase=True,
                            min_df=1,
                        ),
                    ),
                ],
                transformer_weights={"word": 1.0, "char": 0.6},
            )
            self.matrix = self.vectorizer.fit_transform(self.documents)

    @property
    def feature_count(self) -> int:
        if self.vectorizer is None:
            return 0
        return len(self.vectorizer.get_feature_names_out())

    def suggest(self) -> list[dict[str, str]]:
        suggestions: list[dict[str, str]] = []
        for member in self.members[:4]:
            suggestions.append({"label": member["fullName"], "kind": "name"})
        for member in self.members[:3]:
            suggestions.append({"label": member["role"], "kind": "role"})
        for member in self.members[:2]:
            suggestions.append({"label": member["feature"], "kind": "feature"})
        return suggestions

    def _exact_matches(self, query: str) -> list[int]:
        return [
            index
            for index, identities in enumerate(self._identities)
            if any(initials_or_alias_matches(query, identity) for identity in identities)
        ]

    def _term_evidence(self, query: str, member: dict[str, Any]) -> tuple[float, list[str]]:
        query_terms = list(dict.fromkeys(content_tokens(query)))
        document_terms = set(content_tokens(search_document(member)))
        matched = [term for term in query_terms if term in document_terms]
        coverage = len(matched) / len(query_terms) if query_terms else 0.0
        return coverage, matched

    @staticmethod
    def _combine(cosine: float, coverage: float) -> float:
        return (CONFIDENCE_COSINE_WEIGHT * cosine) + (CONFIDENCE_COVERAGE_WEIGHT * coverage)

    def _reason(
        self,
        member: dict[str, Any],
        cosine: float,
        coverage: float,
        confidence: float,
        matched_terms: list[str],
        exact: str | None,
    ) -> tuple[str, list[str]]:
        if exact:
            return (
                f'Exact name or alias "{exact}" matched {member["fullName"]}.',
                [token for token in content_tokens(exact) if token],
            )

        terms = matched_terms[:6]
        if terms:
            reason = (
                f"Matched profile terms: {', '.join(terms)}. "
                f"TF-IDF cosine {cosine:.2f} and query-term coverage {coverage:.2f} "
                f"give a confidence of {confidence:.2f}, above the {self.threshold:.2f} threshold."
            )
        else:
            reason = (
                f"TF-IDF cosine {cosine:.2f} and query-term coverage {coverage:.2f} "
                f"give a confidence of {confidence:.2f}, above the {self.threshold:.2f} threshold. "
                "No exact query term was shared."
            )
        return reason, terms

    def match(self, query: str) -> dict[str, Any]:
        """Return a grounded match or a no-match explanation. Never invents facts."""
        if not self.members or self.vectorizer is None or self.matrix is None:
            return {
                "match": None,
                "confidence": 0.0,
                "reason": "No approved member dataset is loaded, so no profile can be returned.",
                "matched_terms": [],
                "suggestions": [],
                "top_candidates": [],
                "boost": None,
            }

        normalized = normalize_text(query)
        exact_indexes = self._exact_matches(normalized)

        if len(exact_indexes) > 1:
            names = [self.members[index]["fullName"] for index in exact_indexes]
            candidates = [
                {
                    "id": self.members[index]["id"],
                    "fullName": self.members[index]["fullName"],
                    "confidence": EXACT_IDENTITY_SCORE,
                }
                for index in exact_indexes
            ]
            return {
                "match": None,
                "confidence": 0.0,
                "reason": (
                    "That name or alias is ambiguous: "
                    + ", ".join(names)
                    + ". Please use a full name, role or feature."
                ),
                "matched_terms": [],
                "suggestions": self.suggest(),
                "top_candidates": candidates,
                "boost": None,
            }

        cosines = cosine_similarity(self.vectorizer.transform([normalized]), self.matrix)[0]
        evidence = [
            self._term_evidence(normalized, member)
            for member in self.members
        ]
        combined = [
            self._combine(float(cosines[index]), evidence[index][0])
            for index in range(len(self.members))
        ]

        boost = None
        if exact_indexes:
            top_index = exact_indexes[0]
            combined[top_index] = max(combined[top_index], EXACT_IDENTITY_SCORE)
            boost = "exact_name_or_alias"
        else:
            top_index = max(range(len(combined)), key=lambda index: (combined[index], float(cosines[index])))

        top_score = float(combined[top_index])
        ranked = sorted(range(len(combined)), key=lambda index: (combined[index], float(cosines[index])), reverse=True)
        top_candidates = [
            {
                "id": self.members[index]["id"],
                "fullName": self.members[index]["fullName"],
                "confidence": round(float(combined[index]), 3),
            }
            for index in ranked[:3]
        ]

        if top_score < self.threshold:
            return {
                "match": None,
                "confidence": round(top_score, 3),
                "reason": (
                    f"No profile reached the {self.threshold:.2f} confidence threshold. "
                    f"The closest score was {top_score:.2f}. "
                    "Try a name, nickname, role or feature from the directory."
                ),
                "matched_terms": [],
                "suggestions": self.suggest(),
                "top_candidates": top_candidates,
                "boost": None,
            }

        member = self.members[top_index]
        cosine = float(cosines[top_index])
        coverage, matched_terms = evidence[top_index]
        exact_label = None
        if boost:
            for identity in self._identities[top_index]:
                if initials_or_alias_matches(normalized, identity):
                    exact_label = identity
                    break
        reason, matched_terms = self._reason(
            member,
            cosine,
            coverage,
            top_score,
            matched_terms,
            exact_label,
        )

        return {
            "match": member,
            "confidence": round(top_score, 3),
            "reason": reason,
            "matched_terms": matched_terms,
            "suggestions": self.suggest(),
            "top_candidates": top_candidates,
            "boost": boost,
        }

    def metadata(self, *, build_commit: str, fingerprint: str) -> dict[str, Any]:
        return {
            "modelVersion": MODEL_VERSION,
            "vectorizerType": (
                "scikit-learn FeatureUnion: TfidfVectorizer word (1,2) + "
                "TfidfVectorizer char_wb (3,5)"
            ),
            "features": (
                f"{self.feature_count} weighted features across {self.documents and len(self.documents) or 0} member documents"
            ),
            "similarity": "Cosine similarity between the question and one document per member.",
            "confidenceMethod": CONFIDENCE_METHOD,
            "threshold": self.threshold,
            "aliasBoost": (
                "An exact full-name or alias phrase raises the cosine score to "
                f"{EXACT_IDENTITY_SCORE:.2f}. Two competing exact identities return no match."
            ),
            "datasetFingerprint": fingerprint,
            "memberCount": len(self.members),
            "buildCommit": build_commit,
            "builtAt": self.built_at,
            "limitations": LIMITATIONS,
        }


def empty_metadata(*, build_commit: str, fingerprint: str, threshold: float) -> dict[str, Any]:
    """Model metadata when members.json is intentionally empty (tests, fresh clone)."""
    return {
        "modelVersion": MODEL_VERSION,
        "vectorizerType": "Not fitted: no approved member documents",
        "features": "0 features",
        "similarity": "Cosine similarity (not fitted)",
        "confidenceMethod": CONFIDENCE_METHOD,
        "threshold": threshold,
        "aliasBoost": f"Exact identity boost to {EXACT_IDENTITY_SCORE:.2f} when data is present.",
        "datasetFingerprint": fingerprint,
        "memberCount": 0,
        "buildCommit": build_commit,
        "builtAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "limitations": LIMITATIONS,
    }
