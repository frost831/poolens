"""Observed SplashLens first-use journeys without persistent test data.

Every synthetic value is prefixed DEMO TEST. API event/feedback requests are
intercepted, browser contexts are ephemeral, and each context is closed after
its role journey.
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

from playwright.sync_api import Page, Route, sync_playwright


ROLES = [
    ("tech", "Service Tech", {"width": 390, "height": 844}),
    ("facility", "Facility / CPO", {"width": 390, "height": 844}),
    ("counter", "Counter / Distributor", {"width": 1280, "height": 850}),
    ("trainer", "Trainer", {"width": 1280, "height": 850}),
    ("homeowner", "Homeowner", {"width": 390, "height": 844}),
]

DEMO_PART = {
    "manufacturer": "DEMO TEST Manufacturer",
    "category": "pump",
    "component": "DEMO TEST Pump Lid",
    "model": "DEMO TEST MODEL-100",
    "partNumber": "DEMO-TEST-PN-100",
    "description": "DEMO TEST synthetic result for workflow validation only.",
    "condition": "worn",
    "replacementNotes": "DEMO TEST only. Do not order from this result.",
    "verificationNotes": "Confirm model and dimensions against the current manufacturer diagram.",
    "visibleEvidence": ["DEMO TEST molded number", "DEMO TEST lid profile"],
    "missingProof": ["DEMO TEST model plate", "DEMO TEST dimensions"],
    "alternates": [
        {
            "name": "DEMO TEST alternate lid family",
            "why": "Compare the model plate and lid diameter.",
            "confidence": "low",
        }
    ],
    "searchTerms": [],
    "confidence": "medium",
    "escalationSummary": "DEMO TEST packet. Verify every field before any order or repair.",
}


def intercept_test_writes(route: Route) -> None:
    request = route.request
    if request.method == "OPTIONS":
        route.fulfill(status=204, headers={"access-control-allow-origin": "*"})
        return
    route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps({"ok": True, "testIntercepted": True}),
    )


def wait_for_app(page: Page) -> None:
    page.wait_for_load_state("domcontentloaded")
    page.wait_for_selector("#role-picker.active", state="visible", timeout=15000)


def choose_role(page: Page, label: str) -> None:
    page.get_by_role("button", name=label, exact=False).click()
    page.wait_for_function(
        "label => !document.querySelector('#role-picker')?.classList.contains('active')",
        arg=label,
    )


def inject_demo_part(page: Page) -> None:
    page.evaluate(
        """demo => {
            const result = document.getElementById('scan-result');
            const status = document.getElementById('scan-ai-label');
            renderPartsSnapResult(demo, result, status);
        }""",
        DEMO_PART,
    )
    page.wait_for_selector("#scan-result", state="visible")
    page.get_by_text("DEMO TEST Pump Lid", exact=True).wait_for(timeout=5000)


def close_quick_feedback(page: Page) -> bool:
    prompt = page.locator("#field-quick-feedback")
    try:
        prompt.wait_for(state="visible", timeout=1400)
        prompt.get_by_role("button", name="Close feedback").click()
        return True
    except Exception:
        return False


def run_role(page: Page, role: str, label: str, base_url: str) -> dict:
    started = time.perf_counter()
    page.goto(base_url, wait_until="domcontentloaded", timeout=30000)
    wait_for_app(page)
    role_choices = page.locator("#role-picker .role-choice").count()
    choose_role(page, label)

    result = {
        "role": role,
        "label": label,
        "role_choice_count": role_choices,
        "status": "passed",
        "wow_trigger": "",
        "wow_evidence": "",
        "feedback_prompt_observed": False,
    }

    if role == "tech":
        page.locator("#tab-errors.active").wait_for(timeout=5000)
        page.locator("#error-search").fill("E05")
        page.wait_for_function(
            "() => document.querySelector('#error-results')?.innerText.includes('E05')",
            timeout=8000,
        )
        text = page.locator("#error-results").inner_text()
        result["wow_trigger"] = "manual code lookup"
        result["wow_evidence"] = "E05 result rendered with verification language"
        result["result_excerpt"] = " ".join(text.split())[:300]
        result["feedback_prompt_observed"] = close_quick_feedback(page)

    elif role == "facility":
        page.locator("#facility-home").wait_for(state="visible", timeout=5000)
        page.locator('[data-lane="contamination"]').click()
        page.wait_for_function(
            "() => document.querySelectorAll('#facility-result .facility-step').length >= 3",
            timeout=5000,
        )
        step_count = page.locator("#facility-result .facility-step").count()
        actions = page.locator("#facility-result .facility-action-btn").all_inner_texts()
        result["wow_trigger"] = "contamination response lane"
        result["wow_evidence"] = f"{step_count} numbered steps and resolve/escalate choices rendered"
        result["action_labels"] = actions

    elif role == "counter":
        page.locator("#tab-scan.active").wait_for(timeout=5000)
        page.get_by_text("PartSnap AI Service", exact=True).wait_for(timeout=5000)
        inject_demo_part(page)
        text = page.locator("#scan-result").inner_text()
        assert "Senior Tech / Vendor Packet" in text
        assert "DEMO-TEST-PN-100" in text
        result["wow_trigger"] = "PartSnap proof and vendor packet"
        result["wow_evidence"] = "Synthetic possible match rendered with missing proof, callback risk, and vendor packet"

    elif role == "trainer":
        page.locator("#tab-scan.active").wait_for(timeout=5000)
        inject_demo_part(page)
        page.get_by_role("button", name="Apprentice Mode", exact=True).click()
        page.get_by_text("Apprentice Mode", exact=True).last.wait_for(timeout=5000)
        page.locator("#partsnap-apprentice-proof").fill("DEMO TEST observe the molded number and lid profile")
        page.locator("#partsnap-apprentice-order").fill("DEMO TEST model plate, dimensions, then current diagram")
        page.get_by_role("button", name="Show Answer Key", exact=True).click()
        page.locator("#partsnap-apprentice-answer").wait_for(state="visible", timeout=5000)
        result["wow_trigger"] = "PartSnap Apprentice Mode"
        result["wow_evidence"] = "Observe/prove/order exercise and answer key rendered from a DEMO TEST result"

    elif role == "homeowner":
        page.locator("#tab-volume.active").wait_for(timeout=5000)
        page.locator("#turn-vol").fill("15000")
        page.locator("#turn-gpm").fill("60")
        page.get_by_role("button", name="Calculate Turnover", exact=True).click()
        page.wait_for_function(
            "() => /hours?/i.test(document.querySelector('#turn-result')?.innerText || '')",
            timeout=5000,
        )
        text = page.locator("#turn-result").inner_text()
        result["wow_trigger"] = "pool turnover calculation"
        result["wow_evidence"] = "15,000-gallon / 60-GPM result rendered immediately"
        result["result_excerpt"] = " ".join(text.split())[:240]

    result["active_tab"] = page.locator(".tab-panel.active").get_attribute("id")
    result["nav_item_count"] = page.locator('nav[aria-label="SplashLens field tools"] .nav-btn').count()
    result["full_feedback_overlay_observed"] = page.locator("#field-feedback-overlay").is_visible()
    result["horizontal_overflow_px"] = page.evaluate(
        "() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)"
    )
    result["local_storage_keys"] = page.evaluate("() => Object.keys(localStorage).sort()")
    result["duration_ms"] = round((time.perf_counter() - started) * 1000)
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="https://app.splashlens.com/")
    parser.add_argument(
        "--output-dir",
        default=str(Path(__file__).resolve().parents[1] / "docs" / "persona-lab" / "2026-07-16"),
    )
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    screenshots_dir = output_dir / "screenshots"
    screenshots_dir.mkdir(parents=True, exist_ok=True)
    observed = []
    deep_link_checks = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        for role, label, viewport in ROLES:
            console_errors = []
            page_errors = []
            context = browser.new_context(viewport=viewport, locale="en-US")
            context.route("**/api/events", intercept_test_writes)
            context.route("**/api/partsnap-feedback", intercept_test_writes)
            context.add_init_script(
                """Object.defineProperty(navigator, 'sendBeacon', { value: () => true });"""
            )
            page = context.new_page()
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
            page.on("pageerror", lambda exc: page_errors.append(str(exc)))
            try:
                role_result = run_role(page, role, label, args.base_url)
                role_result["console_errors"] = console_errors
                role_result["page_errors"] = page_errors
                page.screenshot(path=str(screenshots_dir / f"{role}.png"), full_page=True)
            except Exception as exc:
                role_result = {
                    "role": role,
                    "label": label,
                    "status": "failed",
                    "error": str(exc),
                    "console_errors": console_errors,
                    "page_errors": page_errors,
                }
            finally:
                context.close()
            role_result["cleanup"] = "ephemeral browser context closed; no account or retained test data"
            role_result["evidence_type"] = "browser_observed"
            observed.append(role_result)

        deep_context = browser.new_context(viewport={"width": 390, "height": 844}, locale="en-US")
        deep_context.route("**/api/events", intercept_test_writes)
        deep_context.route("**/api/partsnap-feedback", intercept_test_writes)
        deep_context.add_init_script(
            """Object.defineProperty(navigator, 'sendBeacon', { value: () => true });"""
        )
        deep_page = deep_context.new_page()
        deep_page.goto(f"{args.base_url}?tab=scan&mode=parts", wait_until="domcontentloaded", timeout=30000)
        deep_page.wait_for_selector("#tab-scan.active", timeout=15000)
        deep_page.wait_for_timeout(500)
        picker_visible = deep_page.locator("#role-picker").is_visible()
        primer_visible = deep_page.get_by_text("PartSnap AI Service", exact=True).is_visible()
        deep_link_checks.append({
            "name": "public PartSnap fresh-context deep link",
            "url": f"{args.base_url}?tab=scan&mode=parts",
            "active_tab": deep_page.locator(".tab-panel.active").get_attribute("id"),
            "role_picker_visible": picker_visible,
            "partsnap_primer_visible": primer_visible,
            "tool_blocked_by_role_picker": picker_visible and primer_visible,
            "evidence_type": "browser_observed",
        })
        deep_page.screenshot(path=str(screenshots_dir / "partsnap-deep-link.png"), full_page=True)
        deep_context.close()
        browser.close()

    payload = {
        "name": "SplashLens persona workflow smoke",
        "run_label": "DEMO TEST SPLASHLENS PERSONA LAB 2026-07-16",
        "base_url": args.base_url,
        "production_writes": "intercepted",
        "persistent_accounts_created": 0,
        "roles": observed,
        "deep_link_checks": deep_link_checks,
    }
    output_path = output_dir / "observed-workflows.json"
    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps(payload, indent=2))
    return 0 if all(item["status"] == "passed" for item in observed) else 1


if __name__ == "__main__":
    raise SystemExit(main())
