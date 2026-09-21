import type { Lead } from "./types";

function csvEscape(cell: string | number): string {
  const text = String(cell ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const lines = [
    headers.join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportCsv(leads: Lead[]) {
  const headers = [
    "score",
    "tier",
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
    "reasons",
  ];
  const rows = leads.map((lead) => [
    lead.score,
    lead.tier,
    lead.first_name,
    lead.last_name,
    lead.email,
    lead.title,
    lead.company,
    lead.website,
    lead.industry,
    lead.employees ?? "",
    lead.country,
    lead.linkedin_url,
    lead.reasons.map((r) => r.text).join("; "),
  ]);
  downloadCsv("leadrank-export.csv", headers, rows);
}

export function exportCrmCsv(leads: Lead[]) {
  const headers = [
    "First Name",
    "Last Name",
    "Email",
    "Job Title",
    "Company Name",
    "Website URL",
    "Country",
    "Lead Score",
    "Lead Tier",
  ];
  const rows = leads
    .filter((lead) => lead.is_valid_email)
    .map((lead) => [
      lead.first_name,
      lead.last_name,
      lead.email,
      lead.title,
      lead.company,
      lead.website,
      lead.country,
      lead.score,
      lead.tier,
    ]);
  downloadCsv("leadrank-crm-export.csv", headers, rows);
}
