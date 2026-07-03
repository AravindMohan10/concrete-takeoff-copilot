# Eval harness for LLM extraction quality

Evals measure how well the extraction pipeline performs against **golden (known-correct) answers** on real PDFs.

## What is an eval?

| Term | Meaning |
|------|---------|
| **Golden case** | A PDF page + expected footing rows (marks, L/W/D, total CY) |
| **Scorer** | Compares model output to golden values within tolerance |
| **Pass rate** | % of cases where all checks pass |
| **Live eval** | Runs real Anthropic extraction (~$0.002–0.006 per case) |
| **Offline eval** | Scores fixture outputs — free, runs in CI |

This is separate from **unit tests** (API routes, guardrails). Evals answer: *"Is the LLM reading schedules correctly?"*

## Run

```bash
cd backend
source .venv/bin/activate

# Free — validates scoring + golden fixtures (CI-safe)
python -m eval.run_eval --offline

# Live — calls Anthropic on sample PDFs (costs ~$0.01 total for 3 cases)
python -m eval.run_eval --live

# Single case
python -m eval.run_eval --live --case portland-s500-p0 -v

# JSON report
python -m eval.run_eval --offline --json
```

## Cases (`cases.yaml`)

| Case | PDF | What it tests |
|------|-----|----------------|
| `portland-s500-p0` | Portland S200 | 5 footings, 2.04 CY — verified against drawing |
| `huntsville-s400-p0` | Huntsville S400 | F1/F2/F3 classic schedule |
| `medstar-s202-empty` | MedStar page 3 | True negative — no schedule on detail sheet |

Add new cases as you verify extractions manually.

## Metrics scored

- Footing count
- Required marks present
- Per-row L/W/D within tolerance (default ±0.05 ft)
- Total CY within tolerance
- Empty schedules include explanatory notes
