import type { ICP, LoadResponse, ScoreResponse } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data.detail === "string") return data.detail;
    return JSON.stringify(data.detail || data);
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function loadSampleLeads(): Promise<LoadResponse> {
  const res = await fetch(`${API_URL}/api/leads/sample`, { method: "POST" });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function uploadLeadsCsv(file: File): Promise<LoadResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/api/leads/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function scoreLeadsRequest(icp: ICP): Promise<ScoreResponse> {
  const res = await fetch(`${API_URL}/api/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(icp),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
