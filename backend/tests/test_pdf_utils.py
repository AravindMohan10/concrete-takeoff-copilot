import pytest

from app.pdf_utils import get_page_count, pdf_page_to_base64_png


def test_get_page_count(sample_pdf_bytes: bytes):
    assert get_page_count(sample_pdf_bytes) == 1


def test_pdf_page_to_base64_png(sample_pdf_bytes: bytes):
    image_b64 = pdf_page_to_base64_png(sample_pdf_bytes, page_index=0, dpi=72)
    assert isinstance(image_b64, str)
    assert len(image_b64) > 100


def test_pdf_page_out_of_range(sample_pdf_bytes: bytes):
    with pytest.raises(ValueError, match="Page 5 not found"):
        pdf_page_to_base64_png(sample_pdf_bytes, page_index=5)
