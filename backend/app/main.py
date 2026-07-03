import io

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.config import settings
from app.extractor import extract_footing_schedule_from_pdf, schedule_to_csv
from app.models import FootingSchedule
from app.pdf_utils import get_page_count, pdf_page_to_base64_png

app = FastAPI(
    title="Rudus Demo — Concrete Takeoff Copilot",
    description="Upload structural PDFs → extract footing schedules → export CY quantities",
    version="0.1.0",
)

_cors_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=(
        r"http://(localhost|127\.0\.0\.1):\d+|"
        r"https://([a-z0-9-]+\.)*vercel\.app"
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/pdf/info")
async def pdf_info(file: UploadFile = File(...)):
    """Return page count so the UI can show a page picker."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Please upload a PDF file")

    pdf_bytes = await file.read()
    return {"filename": file.filename, "page_count": get_page_count(pdf_bytes)}


@app.post("/api/pdf/render")
async def render_page(
    file: UploadFile = File(...),
    page: int = Form(0),
):
    """Render one PDF page as PNG (base64) for the canvas viewer."""
    pdf_bytes = await file.read()
    try:
        image_b64 = pdf_page_to_base64_png(pdf_bytes, page_index=page)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e

    return {"page": page, "image": image_b64}


@app.post("/api/extract/footing-schedule", response_model=FootingSchedule)
async def extract_footings(
    file: UploadFile = File(...),
    page: int = Form(0),
):
    """
    Core takeoff pipeline:
    PDF page → PNG → Claude vision → structured footing schedule → CY volumes
    """
    pdf_bytes = await file.read()
    try:
        schedule = extract_footing_schedule_from_pdf(pdf_bytes, page_index=page)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    except Exception as e:
        raise HTTPException(502, f"Extraction failed: {e}") from e

    return schedule


@app.post("/api/export/csv")
async def export_csv(
    file: UploadFile = File(...),
    page: int = Form(0),
):
    """Extract and return CSV in one shot (for download button)."""
    pdf_bytes = await file.read()
    try:
        schedule = extract_footing_schedule_from_pdf(pdf_bytes, page_index=page)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    except Exception as e:
        raise HTTPException(502, f"Extraction failed: {e}") from e

    csv_content = schedule_to_csv(schedule)
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=footing_takeoff.csv"},
    )
