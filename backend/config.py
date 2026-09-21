import os
import re
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "http://localhost:3000")
SAMPLE_CSV_PATH = Path(__file__).parent / "sample_leads.csv"

FREE_EMAIL_DOMAINS = {
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
    "aol.com",
    "protonmail.com",
    "mail.com",
    "live.com",
    "msn.com",
}

ROLE_LOCAL_PARTS = {"info", "sales", "admin", "support", "hello", "contact", "team", "help"}

REQUIRED_CSV_COLUMNS = [
    "first_name",
    "last_name",
    "email",
    "title",
    "company",
    "website",
    "industry",
    "employees",
    "country",
    "linkedin_url",
]

EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$")

COUNTRY_ALIASES = {
    "us": "united states",
    "usa": "united states",
    "u.s.": "united states",
    "u.s.a.": "united states",
    "america": "united states",
    "uk": "united kingdom",
    "u.k.": "united kingdom",
    "gb": "united kingdom",
    "great britain": "united kingdom",
    "england": "united kingdom",
    "uae": "united arab emirates",
    "u.a.e.": "united arab emirates",
}
