import json
from typing import Any

from fastapi import APIRouter, HTTPException

from database import fetch_all_leads, fetch_load_stats
from schemas import ICP
from services.scoring import build_insights, score_lead

router = APIRouter()

score_cache: dict[str, dict[str, Any]] = {}


@router.post("/api/score")
def score_leads(icp: ICP):
    cache_key = json.dumps(icp.model_dump(), sort_keys=True)
    if cache_key in score_cache:
        return score_cache[cache_key]

    leads = fetch_all_leads()
    if not leads:
        raise HTTPException(
            status_code=400,
            detail="No leads loaded. Load sample leads or upload a CSV first.",
        )

    scored: list[dict[str, Any]] = []
    for lead in leads:
        score, tier, reasons = score_lead(lead, icp)
        scored.append(
            {
                "id": lead["id"],
                "first_name": lead["first_name"],
                "last_name": lead["last_name"],
                "email": lead["email"],
                "title": lead["title"],
                "company": lead["company"],
                "website": lead["website"],
                "industry": lead["industry"],
                "employees": lead["employees"],
                "country": lead["country"],
                "linkedin_url": lead["linkedin_url"],
                "company_domain": lead["company_domain"],
                "is_valid_email": lead["is_valid_email"],
                "is_free_email": lead["is_free_email"],
                "is_role_email": lead["is_role_email"],
                "missing_fields": lead["missing_fields"],
                "score": score,
                "tier": tier,
                "reasons": reasons,
            }
        )

    scored.sort(key=lambda x: (-x["score"], x["company"] or "", x["last_name"] or ""))

    load_stats = fetch_load_stats()
    stats = {
        "total_loaded": load_stats["total_loaded"] or len(leads),
        "duplicates_removed": load_stats["duplicates_removed"],
        "invalid_emails": load_stats["invalid_emails"],
        "hot_leads": sum(1 for l in scored if l["tier"] == "Hot"),
        "warm_leads": sum(1 for l in scored if l["tier"] == "Warm"),
        "cold_leads": sum(1 for l in scored if l["tier"] == "Cold"),
    }

    result = {
        "leads": scored,
        "stats": stats,
        "insights": build_insights(scored),
    }
    score_cache[cache_key] = result
    return result
