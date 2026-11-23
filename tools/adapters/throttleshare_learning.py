"""Shadow-only ThrottleShare connector; standard library, no customer identifiers.

Call record_category_outcome after consented, verified booking outcomes. The
service retains a pending contribution; verification uses a separate owner key.
The caller must not call this for unconsented searches or infer booking success.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
from urllib.parse import urlparse
from urllib.request import Request, urlopen

CONSENT_VERSION = "equipment-feedback-2026-11-23"


def category_observation(*, market: str, query: str, category: str) -> dict:
    """Only aggregate market/category labels are allowed, never names or IDs."""
    values = [market, query, category]
    if any(not isinstance(v, str) or not re.fullmatch(r"[A-Za-z0-9 ,&+.'/-]{1,100}", v) for v in values):
        raise ValueError("Use market, equipment-query and category labels only")
    if any("@" in v or re.search(r"\d{7,}|https?", v, re.I) for v in values):
        raise ValueError("Contact details and URLs are forbidden")
    return {"brand": market, "model": category, "component": query, "category": category, "terms": []}


def _post(body: dict) -> dict:
    url = os.environ.get("FLAGSHIP_LEARNING_URL", "https://app.splashlens.com/api/learning")
    target = urlparse(url)
    if target.scheme != "https" and target.hostname not in {"localhost", "127.0.0.1"}:
        raise ValueError("HTTPS endpoint required")
    key = os.environ.get("FLAGSHIP_LEARNING_THROTTLESHARE_INGEST_KEY", "")
    if len(key) < 32:
        raise ValueError("Product-scoped ingestion key is missing")
    if target.query:
        raise ValueError("Endpoint must not contain query parameters")
    request = Request(url + "?product=throttleshare", data=json.dumps(body).encode(),
                      headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"})
    with urlopen(request, timeout=20) as response:
        return json.load(response)


def record_category_outcome(*, event_key: str, market: str, query: str, requested_category: str, confirmed_category: str,
                            baseline_categories: list[str], consent: bool,
                            production_confirmed_outcome: bool = False) -> dict:
    if consent is not True:
        raise ValueError("Explicit product-learning consent is required")
    # The confirmed answer must never enter the observation used for prediction.
    observation = category_observation(market=market, query=query, category=requested_category or 'unclassified')
    opaque_id = hashlib.sha256(("throttleshare-learning:" + event_key).encode()).hexdigest()
    receipt = _post({"action": "observe", "id": opaque_id, "observation": observation,
                     "baseline": baseline_categories,
                     "provenance": "production_confirmed_outcome" if production_confirmed_outcome else "qa"})
    return _post({"action": "submit", "receipt": receipt["receipt"], "consent": True,
                  "consentVersion": CONSENT_VERSION, "outcome": "confirmed", "reportedLabel": confirmed_category})
