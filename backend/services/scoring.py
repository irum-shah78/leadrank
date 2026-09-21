import re
from typing import Any

from config import COUNTRY_ALIASES
from schemas import ICP


def normalize_country(value: str) -> str:
    key = value.strip().lower()
    return COUNTRY_ALIASES.get(key, key)


def title_keyword_matches(keyword: str, title: str) -> bool:
    pattern = r"(?<![A-Za-z0-9])" + re.escape(keyword) + r"(?![A-Za-z0-9])"
    return bool(re.search(pattern, title, flags=re.IGNORECASE))


def score_lead(lead: dict[str, Any], icp: ICP) -> tuple[int, str, list[dict[str, Any]]]:
    score = 0
    reasons: list[dict[str, Any]] = []

    industries = [i.strip().lower() for i in icp.industries if i.strip()]
    lead_industry = (lead.get("industry") or "").strip().lower()
    if industries:
        if lead_industry and any(i in lead_industry or lead_industry in i for i in industries):
            score += 30
            reasons.append({"text": f"Industry matches: {lead.get('industry')}", "positive": True})
        else:
            reasons.append({"text": "Industry does not match ICP", "positive": False})
    else:
        score += 15
        reasons.append({"text": "No industry filter set", "positive": False})

    title_keywords = [t.strip().lower() for t in icp.title_keywords if t.strip()]
    lead_title = (lead.get("title") or "").strip()
    if title_keywords:
        matched = [kw for kw in title_keywords if title_keyword_matches(kw, lead_title)]
        if matched:
            score += 30
            reasons.append({"text": f"Title matches: {matched[0]}", "positive": True})
        else:
            reasons.append({"text": "Title does not match ICP keywords", "positive": False})
    else:
        score += 15
        reasons.append({"text": "No title keywords set", "positive": False})

    employees = lead.get("employees")
    if employees is None:
        reasons.append({"text": "Company size unknown", "positive": False})
    elif icp.min_employees <= employees <= icp.max_employees:
        score += 20
        reasons.append({"text": f"Company size fits: {employees}", "positive": True})
    else:
        reasons.append({"text": "Company size outside range", "positive": False})

    countries = [normalize_country(c) for c in icp.countries if c.strip()]
    lead_country = normalize_country(lead.get("country") or "")
    if countries:
        if lead_country and lead_country in countries:
            score += 10
            reasons.append({"text": f"Country matches: {lead.get('country')}", "positive": True})
        else:
            reasons.append({"text": "Country does not match ICP", "positive": False})
    else:
        score += 5
        reasons.append({"text": "No country filter set", "positive": False})

    email_points = 0
    if lead.get("is_valid_email"):
        email_points += 6
        if not lead.get("is_free_email"):
            email_points += 2
        else:
            reasons.append({"text": "Uses free email domain", "positive": False})
        if not lead.get("is_role_email"):
            email_points += 2
        else:
            reasons.append({"text": "Role-based email address", "positive": False})
        if email_points >= 8 and not lead.get("is_free_email") and not lead.get("is_role_email"):
            reasons.append({"text": "Work email looks solid", "positive": True})
    else:
        reasons.append(
            {"text": "No usable email, cannot be contacted yet", "positive": False}
        )
    score += email_points

    if lead.get("missing_fields"):
        reasons.append(
            {"text": f"Missing fields: {lead['missing_fields']}", "positive": False}
        )

    score = max(0, min(100, score))
    if not lead.get("is_valid_email"):
        score = min(score, 60)
    if score >= 75:
        tier = "Hot"
    elif score >= 40:
        tier = "Warm"
    else:
        tier = "Cold"
    return score, tier, reasons


def build_insights(scored: list[dict[str, Any]]) -> list[str]:
    insights: list[str] = []
    hot = [l for l in scored if l["tier"] == "Hot"]
    if hot:
        industry_counts: dict[str, int] = {}
        for lead in hot:
            industry = lead.get("industry") or "Unknown"
            industry_counts[industry] = industry_counts.get(industry, 0) + 1
        top_industry = max(industry_counts, key=industry_counts.get)
        insights.append(
            f"Most hot leads are in {top_industry} ({industry_counts[top_industry]} leads)."
        )

        country_counts: dict[str, int] = {}
        for lead in hot:
            country = lead.get("country") or "Unknown"
            country_counts[country] = country_counts.get(country, 0) + 1
        top_country = max(country_counts, key=country_counts.get)
        insights.append(
            f"Top country among hot leads: {top_country} ({country_counts[top_country]})."
        )
    else:
        insights.append("No hot leads yet. Tighten or broaden your ICP and rescore.")
    return insights
