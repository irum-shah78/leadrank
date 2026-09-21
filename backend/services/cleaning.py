import csv
import io
from typing import Any
from urllib.parse import urlparse

from fastapi import HTTPException

from config import EMAIL_RE, FREE_EMAIL_DOMAINS, REQUIRED_CSV_COLUMNS, ROLE_LOCAL_PARTS


def normalize_text(value: str | None) -> str:
    if value is None:
        return ""
    return " ".join(str(value).strip().split())


def parse_employees(value: Any) -> int | None:
    if value is None or str(value).strip() == "":
        return None
    try:
        return int(float(str(value).strip().replace(",", "")))
    except ValueError:
        return None


def extract_domain_from_website(website: str) -> str:
    website = normalize_text(website)
    if not website:
        return ""
    if not website.startswith(("http://", "https://")):
        website = "https://" + website
    try:
        host = urlparse(website).hostname or ""
    except Exception:
        return ""
    if host.startswith("www."):
        host = host[4:]
    return host.lower()


def extract_domain_from_email(email: str) -> str:
    if "@" not in email:
        return ""
    return email.split("@", 1)[1].lower().strip()


def validate_email(email: str) -> bool:
    if not email:
        return False
    return bool(EMAIL_RE.match(email))


def is_role_email(email: str) -> bool:
    if "@" not in email:
        return False
    local = email.split("@", 1)[0].lower()
    return local in ROLE_LOCAL_PARTS


def missing_fields_for(row: dict[str, Any]) -> list[str]:
    checks = {
        "first_name": row.get("first_name"),
        "last_name": row.get("last_name"),
        "email": row.get("email"),
        "title": row.get("title"),
        "company": row.get("company"),
        "industry": row.get("industry"),
        "employees": row.get("employees"),
        "country": row.get("country"),
    }
    missing = []
    for key, value in checks.items():
        if value is None or (isinstance(value, str) and value.strip() == ""):
            missing.append(key)
    return missing


def parse_csv_rows(text: str) -> list[dict[str, Any]]:
    if not text.strip():
        raise HTTPException(status_code=400, detail="CSV file is empty")

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV is missing a header row")

    headers = [h.strip().lower() for h in reader.fieldnames if h]
    missing_cols = [c for c in REQUIRED_CSV_COLUMNS if c not in headers]
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=f"CSV missing required columns: {', '.join(missing_cols)}",
        )

    rows: list[dict[str, Any]] = []
    for i, raw in enumerate(reader, start=2):
        if raw is None:
            continue
        normalized = {
            (k or "").strip().lower(): (v if v is not None else "") for k, v in raw.items()
        }
        if all(not str(v).strip() for v in normalized.values()):
            continue
        try:
            rows.append(
                {
                    "first_name": normalize_text(normalized.get("first_name")),
                    "last_name": normalize_text(normalized.get("last_name")),
                    "email": normalize_text(normalized.get("email")).lower(),
                    "title": normalize_text(normalized.get("title")),
                    "company": normalize_text(normalized.get("company")),
                    "website": normalize_text(normalized.get("website")),
                    "industry": normalize_text(normalized.get("industry")),
                    "employees": parse_employees(normalized.get("employees")),
                    "country": normalize_text(normalized.get("country")),
                    "linkedin_url": normalize_text(normalized.get("linkedin_url")),
                }
            )
        except Exception as exc:
            raise HTTPException(
                status_code=400, detail=f"Invalid data on CSV row {i}: {exc}"
            ) from exc

    if not rows:
        raise HTTPException(status_code=400, detail="CSV contains no lead rows")
    return rows


def clean_and_dedupe(rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], int]:
    seen_emails: set[str] = set()
    seen_name_company: set[str] = set()
    cleaned: list[dict[str, Any]] = []
    duplicates_removed = 0

    for row in rows:
        email = row["email"]
        name_company_key = f"{row['first_name'].lower()}|{row['last_name'].lower()}|{row['company'].lower()}"

        is_duplicate = False
        if email:
            if email in seen_emails:
                is_duplicate = True
            else:
                seen_emails.add(email)
        else:
            if name_company_key in seen_name_company:
                is_duplicate = True
            else:
                seen_name_company.add(name_company_key)

        if is_duplicate:
            duplicates_removed += 1
            continue

        is_valid = validate_email(email)
        domain_from_site = extract_domain_from_website(row["website"])
        domain_from_email = extract_domain_from_email(email) if is_valid else ""
        company_domain = domain_from_site or domain_from_email
        is_free = bool(domain_from_email and domain_from_email in FREE_EMAIL_DOMAINS)
        is_role = is_role_email(email) if is_valid else False
        missing = missing_fields_for(row)

        cleaned.append(
            {
                **row,
                "email_normalized": email,
                "company_domain": company_domain,
                "is_valid_email": is_valid,
                "is_free_email": is_free,
                "is_role_email": is_role,
                "is_duplicate": False,
                "missing_fields": ",".join(missing),
            }
        )

    return cleaned, duplicates_removed
