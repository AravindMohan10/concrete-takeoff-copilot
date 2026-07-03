#!/usr/bin/env python3
"""
Run extraction evals against golden cases.

Usage:
  cd backend
  source .venv/bin/activate
  python -m eval.run_eval --offline    # score fixture outputs (no API cost)
  python -m eval.run_eval --live       # call Anthropic on each case (~$0.01/case)
  python -m eval.run_eval --live --case portland-s500-p0
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import yaml

from app.extractor import extract_footing_schedule_from_pdf
from app.models import FootingRow, FootingSchedule
from eval.scoring import CaseResult, score_case

ROOT = Path(__file__).resolve().parents[2]
CASES_PATH = Path(__file__).resolve().parent / "cases.yaml"


def load_cases() -> list[dict]:
    data = yaml.safe_load(CASES_PATH.read_text())
    return data["cases"]


def fixture_schedule(case_id: str) -> FootingSchedule | None:
    """Canned outputs for offline scoring tests (no API)."""
    fixtures: dict[str, FootingSchedule] = {
        "portland-s500-p0": FootingSchedule(
            footings=[
                FootingRow(mark="1", length_ft=2.833, width_ft=1.583, depth_ft=1.5),
                FootingRow(mark="2", length_ft=2.833, width_ft=1.583, depth_ft=1.5),
                FootingRow(mark="3", length_ft=2.833, width_ft=1.583, depth_ft=1.5),
                FootingRow(mark="4", length_ft=4.667, width_ft=1.75, depth_ft=1.75),
                FootingRow(mark="5", length_ft=6.667, width_ft=1.75, depth_ft=1.75),
            ],
            confidence="medium",
        ),
        "huntsville-s400-p0": FootingSchedule(
            footings=[
                FootingRow(mark="F1", length_ft=4, width_ft=4, depth_ft=1.333),
                FootingRow(mark="F2", length_ft=5, width_ft=5, depth_ft=1.333),
                FootingRow(mark="F3", length_ft=6, width_ft=6, depth_ft=1.333),
            ],
            confidence="high",
        ),
        "medstar-s202-empty": FootingSchedule(
            footings=[],
            notes=["Page shows footing details only, no schedule table."],
            confidence="high",
        ),
    }
    return fixtures.get(case_id)


def run_live(case: dict) -> FootingSchedule:
    pdf_path = ROOT / case["pdf"]
    if not pdf_path.exists():
        raise FileNotFoundError(pdf_path)
    pdf_bytes = pdf_path.read_bytes()
    return extract_footing_schedule_from_pdf(pdf_bytes, page_index=case["page"])


def print_result(result: CaseResult, verbose: bool = False) -> None:
    status = "PASS" if result.passed else "FAIL"
    print(f"\n[{status}] {result.case_id}  score={result.score:.0%}")
    if verbose or not result.passed:
        for c in result.checks:
            print(f"  {c}")
        for e in result.errors:
            print(f"  ✗ {e}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Run footing extraction evals")
    parser.add_argument("--live", action="store_true", help="Call Anthropic API (costs money)")
    parser.add_argument("--offline", action="store_true", help="Score fixture outputs only")
    parser.add_argument("--case", help="Run a single case id")
    parser.add_argument("--json", action="store_true", help="Output JSON report")
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args()

    if not args.live and not args.offline:
        args.offline = True  # default: free

    cases = load_cases()
    if args.case:
        cases = [c for c in cases if c["id"] == args.case]
        if not cases:
            print(f"Unknown case: {args.case}", file=sys.stderr)
            return 1

    results: list[CaseResult] = []
    mode = "live" if args.live else "offline"
    print(f"Running {len(cases)} eval case(s) [{mode}]")

    for case in cases:
        cid = case["id"]
        try:
            if args.live:
                schedule = run_live(case)
            else:
                schedule = fixture_schedule(cid)
                if schedule is None:
                    print(f"Skipping {cid}: no offline fixture", file=sys.stderr)
                    continue
            result = score_case(cid, schedule, case["expect"])
            results.append(result)
            if not args.json:
                print_result(result, verbose=args.verbose)
        except Exception as e:
            print(f"\n[ERROR] {cid}: {e}", file=sys.stderr)
            results.append(CaseResult(case_id=cid, passed=False, score=0.0, errors=[str(e)]))

    passed = sum(1 for r in results if r.passed)
    total = len(results)
    avg_score = sum(r.score for r in results) / total if total else 0

    summary = {
        "mode": mode,
        "passed": passed,
        "total": total,
        "avg_score": round(avg_score, 3),
        "cases": [
            {
                "id": r.case_id,
                "passed": r.passed,
                "score": round(r.score, 3),
                "errors": r.errors,
            }
            for r in results
        ],
    }

    if args.json:
        print(json.dumps(summary, indent=2))
    else:
        print(f"\n{'=' * 40}")
        print(f"Summary: {passed}/{total} passed  avg score {avg_score:.0%}")

    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
