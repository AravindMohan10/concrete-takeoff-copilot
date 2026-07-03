import anthropic
from pydantic import ValidationError

from app.config import settings
from app.models import FootingSchedule
from app.pdf_utils import pdf_page_to_base64_png

SYSTEM_PROMPT = """You are a structural drawing analyst specializing in concrete takeoffs.

Extract footing schedule data from construction drawing images uploaded by estimators.
Drawings vary by firm: different title blocks, table layouts, scan quality, and notation.

Rules:
- Find the FOOTING SCHEDULE (or similar) table on the page
- Extract every footing row you can clearly read
- Dimensions may appear as feet-inches: 4'-0", 4' - 0", 4' 0", or decimal feet
- Convert all dimensions to decimal feet (4'-6" = 4.5, 1'-6" = 1.5)
- mark = footing label (F1, F2, WF1, CF1, etc.)
- Columns may be labeled LENGTH/WIDTH/DEPTH, L/W/D, or SIZE
- If rebar is listed, capture it; otherwise null
- If scale is visible on the sheet, capture it in scale
- Set confidence to "high" if the table is clear, "medium" if mostly readable, "low" if guessing
- Do NOT invent footings that are not visible in the drawing
- If the page has no footing schedule, return an empty footings list and explain in notes"""

USER_PROMPT = (
    "Extract all footing rows from this structural drawing page. "
    "Look for a FOOTING SCHEDULE table with marks (F1, F2...) and dimensions. "
    "Return the data using the submit_footing_schedule tool."
)

TOOL_NAME = "submit_footing_schedule"

# Tool schema excludes server-set metadata fields
_TOOL_INPUT_SCHEMA = FootingSchedule.model_json_schema()
for key in ("model_used", "extraction_tier"):
    _TOOL_INPUT_SCHEMA.get("properties", {}).pop(key, None)
if "required" in _TOOL_INPUT_SCHEMA:
    _TOOL_INPUT_SCHEMA["required"] = [
        r for r in _TOOL_INPUT_SCHEMA["required"] if r not in ("model_used", "extraction_tier")
    ]


def _needs_strong_pass(schedule: FootingSchedule) -> bool:
    """Retry with Sonnet + higher DPI when Haiku output looks unreliable."""
    if not settings.enable_sonnet_fallback:
        return False
    if len(schedule.footings) == 0:
        return True
    if schedule.confidence == "low":
        return True
    for row in schedule.footings:
        if row.length_ft <= 0 or row.width_ft <= 0 or row.depth_ft <= 0:
            return True
    return False


def _call_model(model: str, image_base64: str) -> FootingSchedule:
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    system: str | list[dict] = SYSTEM_PROMPT
    if settings.enable_prompt_cache:
        system = [
            {
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ]

    tool_def: dict = {
        "name": TOOL_NAME,
        "description": "Structured footing schedule extracted from the drawing page.",
        "input_schema": _TOOL_INPUT_SCHEMA,
    }
    if settings.enable_prompt_cache:
        tool_def["cache_control"] = {"type": "ephemeral"}

    response = client.messages.create(
        model=model,
        max_tokens=4096,
        system=system,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": image_base64,
                        },
                    },
                    {"type": "text", "text": USER_PROMPT},
                ],
            }
        ],
        tools=[tool_def],
        tool_choice={"type": "tool", "name": TOOL_NAME},
    )

    for block in response.content:
        if block.type == "tool_use" and block.name == TOOL_NAME:
            try:
                return FootingSchedule.model_validate(block.input)
            except ValidationError as e:
                raise ValueError(f"Invalid structured response: {e}") from e

    raise ValueError("No footing schedule returned from extraction")


def _tag_result(schedule: FootingSchedule, model: str, tier: str) -> FootingSchedule:
    schedule.model_used = model
    schedule.extraction_tier = tier
    return schedule


def extract_footing_schedule(image_base64: str) -> FootingSchedule:
    """Extract from a pre-rendered page image (Haiku, with Sonnet fallback on same image)."""
    if not settings.anthropic_api_key:
        raise ValueError(
            "ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key."
        )

    fast = _tag_result(
        _call_model(settings.anthropic_model_fast, image_base64),
        settings.anthropic_model_fast,
        "fast",
    )

    if _needs_strong_pass(fast):
        strong = _tag_result(
            _call_model(settings.anthropic_model_strong, image_base64),
            settings.anthropic_model_strong,
            "strong",
        )
        return strong

    return fast


def extract_footing_schedule_from_pdf(pdf_bytes: bytes, page_index: int = 0) -> FootingSchedule:
    """
    Full pipeline: render PDF page, extract with Haiku, retry with Sonnet at higher DPI if needed.
    """
    if not settings.anthropic_api_key:
        raise ValueError(
            "ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key."
        )

    fast_image = pdf_page_to_base64_png(
        pdf_bytes, page_index=page_index, dpi=settings.pdf_dpi_fast
    )
    fast = _tag_result(
        _call_model(settings.anthropic_model_fast, fast_image),
        settings.anthropic_model_fast,
        "fast",
    )

    if not _needs_strong_pass(fast):
        return fast

    strong_image = pdf_page_to_base64_png(
        pdf_bytes, page_index=page_index, dpi=settings.pdf_dpi_strong
    )
    return _tag_result(
        _call_model(settings.anthropic_model_strong, strong_image),
        settings.anthropic_model_strong,
        "strong",
    )


def schedule_to_csv(schedule: FootingSchedule) -> str:
    """Export footing quantities as CSV for estimator workflows."""
    lines = ["mark,length_ft,width_ft,depth_ft,volume_cy,rebar"]
    for f in schedule.footings:
        rebar = (f.rebar or "").replace(",", ";")
        lines.append(
            f"{f.mark},{f.length_ft},{f.width_ft},{f.depth_ft},{f.volume_cy},{rebar}"
        )
    total_cy = sum(f.volume_cy for f in schedule.footings)
    lines.append(f"TOTAL,,,,{round(total_cy, 2)},")
    return "\n".join(lines) + "\n"
