import json
from typing import Any

import psycopg
from fastapi import HTTPException

from config import DATABASE_URL


def get_conn():
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="DATABASE_URL is not set")
    return psycopg.connect(DATABASE_URL)


def init_db():
    if not DATABASE_URL:
        return
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS leads (
                    id SERIAL PRIMARY KEY,
                    first_name TEXT,
                    last_name TEXT,
                    email TEXT,
                    title TEXT,
                    company TEXT,
                    website TEXT,
                    industry TEXT,
                    employees INTEGER,
                    country TEXT,
                    linkedin_url TEXT,
                    email_normalized TEXT,
                    company_domain TEXT,
                    is_valid_email BOOLEAN DEFAULT FALSE,
                    is_free_email BOOLEAN DEFAULT FALSE,
                    is_role_email BOOLEAN DEFAULT FALSE,
                    is_duplicate BOOLEAN DEFAULT FALSE,
                    missing_fields TEXT,
                    raw_json JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS load_stats (
                    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
                    total_loaded INTEGER NOT NULL DEFAULT 0,
                    duplicates_removed INTEGER NOT NULL DEFAULT 0,
                    invalid_emails INTEGER NOT NULL DEFAULT 0
                )
                """
            )
            cur.execute(
                """
                INSERT INTO load_stats (id, total_loaded, duplicates_removed, invalid_emails)
                VALUES (1, 0, 0, 0)
                ON CONFLICT (id) DO NOTHING
                """
            )
        conn.commit()


def clear_and_insert_leads(leads: list[dict[str, Any]]) -> None:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM leads")
            for lead in leads:
                cur.execute(
                    """
                    INSERT INTO leads (
                        first_name, last_name, email, title, company, website,
                        industry, employees, country, linkedin_url,
                        email_normalized, company_domain, is_valid_email,
                        is_free_email, is_role_email, is_duplicate, missing_fields, raw_json
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, %s, %s,
                        %s, %s, %s, %s, %s
                    )
                    """,
                    (
                        lead["first_name"],
                        lead["last_name"],
                        lead["email"],
                        lead["title"],
                        lead["company"],
                        lead["website"],
                        lead["industry"],
                        lead["employees"],
                        lead["country"],
                        lead["linkedin_url"],
                        lead["email_normalized"],
                        lead["company_domain"],
                        lead["is_valid_email"],
                        lead["is_free_email"],
                        lead["is_role_email"],
                        lead["is_duplicate"],
                        lead["missing_fields"],
                        json.dumps(lead),
                    ),
                )
        conn.commit()


def fetch_all_leads() -> list[dict[str, Any]]:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, first_name, last_name, email, title, company, website,
                       industry, employees, country, linkedin_url, email_normalized,
                       company_domain, is_valid_email, is_free_email, is_role_email,
                       is_duplicate, missing_fields
                FROM leads
                ORDER BY id
                """
            )
            cols = [d.name for d in cur.description]
            return [dict(zip(cols, row)) for row in cur.fetchall()]


def save_load_stats(total_loaded: int, duplicates_removed: int, invalid_emails: int) -> None:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO load_stats (id, total_loaded, duplicates_removed, invalid_emails)
                VALUES (1, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    total_loaded = EXCLUDED.total_loaded,
                    duplicates_removed = EXCLUDED.duplicates_removed,
                    invalid_emails = EXCLUDED.invalid_emails
                """,
                (total_loaded, duplicates_removed, invalid_emails),
            )
        conn.commit()


def fetch_load_stats() -> dict[str, int]:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT total_loaded, duplicates_removed, invalid_emails
                FROM load_stats
                WHERE id = 1
                """
            )
            row = cur.fetchone()
            if not row:
                return {
                    "total_loaded": 0,
                    "duplicates_removed": 0,
                    "invalid_emails": 0,
                }
            return {
                "total_loaded": row[0],
                "duplicates_removed": row[1],
                "invalid_emails": row[2],
            }
