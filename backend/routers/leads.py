from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile

from config import SAMPLE_CSV_PATH
from database import clear_and_insert_leads, save_load_stats
from routers.score import score_cache
from services.cleaning import clean_and_dedupe, parse_csv_rows

router = APIRouter()


def _store_leads(rows: list[dict[str, Any]]) -> dict[str, int]:
    cleaned, duplicates_removed = clean_and_dedupe(rows)
    score_cache.clear()
    clear_and_insert_leads(cleaned)
    invalid = sum(1 for l in cleaned if not l["is_valid_email"])
    save_load_stats(len(rows), duplicates_removed, invalid)
    return {
        "loaded": len(rows),
        "stored": len(cleaned),
        "duplicates_removed": duplicates_removed,
        "invalid_emails": invalid,
    }


@router.post("/api/leads/sample")
def load_sample():
    if not SAMPLE_CSV_PATH.exists():
        raise HTTPException(status_code=500, detail="sample_leads.csv not found")
    text = SAMPLE_CSV_PATH.read_text(encoding="utf-8")
    rows = parse_csv_rows(text)
    return _store_leads(rows)


@router.post("/api/leads/upload")
async def upload_leads(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")
    try:
        content = await file.read()
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=400, detail="CSV must be UTF-8 encoded"
        ) from exc

    rows = parse_csv_rows(text)
    return _store_leads(rows)
