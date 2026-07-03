import base64

import fitz  # PyMuPDF


import base64

import fitz  # PyMuPDF

# Anthropic API rejects images if either dimension exceeds 8000px
MAX_IMAGE_DIMENSION = 7900


def pdf_page_to_base64_png(pdf_bytes: bytes, page_index: int = 0, dpi: int = 200) -> str:
    """
    Render a PDF page to a base64-encoded PNG string.

    Large format sheets (ARCH D/E) are auto-scaled to stay under API pixel limits.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    if page_index >= len(doc):
        raise ValueError(f"Page {page_index} not found; PDF has {len(doc)} pages")

    page = doc[page_index]
    zoom = dpi / 72  # PDF default is 72 DPI

    # Shrink render if page would exceed vision API max dimension
    rect = page.rect
    render_w = rect.width * zoom
    render_h = rect.height * zoom
    if max(render_w, render_h) > MAX_IMAGE_DIMENSION:
        scale = MAX_IMAGE_DIMENSION / max(render_w, render_h)
        zoom *= scale

    matrix = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=matrix, alpha=False)
    png_bytes = pix.tobytes("png")
    doc.close()

    return base64.b64encode(png_bytes).decode("utf-8")


def get_page_count(pdf_bytes: bytes) -> int:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    count = len(doc)
    doc.close()
    return count
