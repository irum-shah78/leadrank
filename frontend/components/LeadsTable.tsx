"use client";

import { useMemo } from "react";

import type { Lead } from "@/lib/types";
import { tierClass } from "@/lib/utils";

type LeadsTableProps = {
  leads: Lead[];
  filteredLeads: Lead[];
  loadingAction: string | null;
};

export default function LeadsTable({
  leads,
  filteredLeads,
  loadingAction,
}: LeadsTableProps) {
  const topContactIds = useMemo(() => {
    function titleHasWholeWord(title: string, keyword: string): boolean {
      const pattern = new RegExp(
        `(^|[^A-Za-z0-9])${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z0-9]|$)`,
        "i"
      );
      return pattern.test(title);
    }

    function seniorityRank(title: string): number {
      const t = title || "";
      if (
        ["founder", "co-founder", "owner", "ceo", "president"].some((k) =>
          titleHasWholeWord(t, k)
        )
      ) {
        return 0;
      }
      if (["cto", "coo", "cfo", "cmo"].some((k) => titleHasWholeWord(t, k))) {
        return 1;
      }
      if (["vp", "head of", "director"].some((k) => titleHasWholeWord(t, k))) {
        return 2;
      }
      return 3;
    }

    const byCompany = new Map<string, Lead[]>();
    for (const lead of leads) {
      const key = (lead.company || "").toLowerCase();
      if (!key) continue;
      const list = byCompany.get(key) || [];
      list.push(lead);
      byCompany.set(key, list);
    }

    const ids = new Set<number>();
    for (const group of byCompany.values()) {
      if (group.length < 2) continue;
      const eligible = group.filter(
        (lead) => lead.is_valid_email && lead.tier !== "Cold"
      );
      if (eligible.length === 0) continue;
      eligible.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return seniorityRank(a.title) - seniorityRank(b.title);
      });
      ids.add(eligible[0].id);
    }
    return ids;
  }, [leads]);

  if (loadingAction === "score") {
    return (
      <p className="border border-line bg-surface py-14 text-center text-sm text-muted">
        Scoring leads against your ICP...
      </p>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center border border-dashed border-border bg-surface px-4 text-center">
        <h2 className="text-sm font-semibold">Ready to score</h2>
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">
          Leads are loaded. Adjust the ICP if needed, then click Score leads.
        </p>
      </div>
    );
  }

  if (filteredLeads.length === 0) {
    return (
      <p className="border border-line bg-surface py-14 text-center text-sm text-muted">
        No leads match the current filters.
      </p>
    );
  }

  return (
    <div className="min-w-0 animate-fade-up">
      <div className="max-h-[min(70vh,720px)] space-y-2 overflow-y-auto md:hidden">
        {filteredLeads.map((lead) => {
          const sortedReasons = [
            ...lead.reasons.filter((r) => !r.positive),
            ...lead.reasons.filter((r) => r.positive),
          ];
          return (
            <article
              key={lead.id}
              className="border border-border bg-surface p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      {lead.first_name} {lead.last_name}
                    </span>
                    {topContactIds.has(lead.id) && (
                      <span className="border border-accent/30 bg-accent/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-accent">
                        Top contact
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-muted">{lead.title}</div>
                  <div className="break-all text-[12px] text-muted">{lead.email}</div>
                  {lead.linkedin_url ? (
                    <a
                      href={lead.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] font-medium text-accent underline-offset-2 hover:underline"
                    >
                      LinkedIn
                    </a>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold tabular-nums">{lead.score}</div>
                  <span
                    className={`mt-1 inline-flex px-1.5 py-0.5 text-[11px] font-semibold ${tierClass(lead.tier)}`}
                  >
                    {lead.tier}
                  </span>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[12px] text-muted">
                <div>
                  <span className="font-medium text-foreground">{lead.company}</span>
                  <div>
                    {lead.employees != null
                      ? `${lead.employees} employees`
                      : "Size unknown"}
                  </div>
                </div>
                <div>
                  <div>{lead.industry || "-"}</div>
                  <div>{lead.country || "-"}</div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {sortedReasons.map((reason) => (
                  <span
                    key={reason.text}
                    className={`max-w-full break-words border px-1.5 py-0.5 text-[10px] leading-tight ${
                      reason.positive
                        ? "border-[#b7d9c3] bg-[#eef7f1] text-hot"
                        : "border-[#e6d0a8] bg-[#faf4ea] text-warm"
                    }`}
                  >
                    {reason.text}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden max-h-[min(70vh,720px)] overflow-auto border border-border bg-surface md:block">
        <table className="w-full table-fixed text-left text-[13px]">
          <thead className="sticky top-0 z-10 border-b border-border bg-[#f5f7f9] text-[11px] uppercase tracking-[0.06em] text-muted">
            <tr>
              <th className="w-[34%] px-3 py-2.5 font-semibold">Lead</th>
              <th className="w-[18%] px-3 py-2.5 font-semibold">Company</th>
              <th className="w-[14%] px-3 py-2.5 font-semibold">Industry</th>
              <th className="w-[14%] px-3 py-2.5 font-semibold">Country</th>
              <th className="w-[10%] px-3 py-2.5 font-semibold">Score</th>
              <th className="w-[10%] px-3 py-2.5 font-semibold">Tier</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => {
              const sortedReasons = [
                ...lead.reasons.filter((r) => !r.positive),
                ...lead.reasons.filter((r) => r.positive),
              ];
              return (
                <tr
                  key={lead.id}
                  className="border-b border-line align-top odd:bg-white even:bg-[#fafbfc] hover:bg-[#f3f7f5]"
                >
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {lead.first_name} {lead.last_name}
                      </span>
                      {topContactIds.has(lead.id) && (
                        <span className="border border-accent/30 bg-accent/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-accent">
                          Top contact
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-muted">{lead.title}</div>
                    <div className="break-all text-[12px] text-muted">{lead.email}</div>
                    {lead.linkedin_url ? (
                      <a
                        href={lead.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] font-medium text-accent underline-offset-2 hover:underline"
                      >
                        LinkedIn
                      </a>
                    ) : null}
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {sortedReasons.map((reason) => (
                        <span
                          key={reason.text}
                          className={`max-w-full break-words border px-1.5 py-0.5 text-[10px] leading-tight ${
                            reason.positive
                              ? "border-[#b7d9c3] bg-[#eef7f1] text-hot"
                              : "border-[#e6d0a8] bg-[#faf4ea] text-warm"
                          }`}
                        >
                          {reason.text}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="break-words font-medium">{lead.company}</div>
                    <div className="text-[12px] text-muted">
                      {lead.employees != null
                        ? `${lead.employees} employees`
                        : "Size unknown"}
                    </div>
                  </td>
                  <td className="break-words px-3 py-2.5 text-muted">
                    {lead.industry || "-"}
                  </td>
                  <td className="break-words px-3 py-2.5 text-muted">
                    {lead.country || "-"}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="mb-1 text-sm font-semibold tabular-nums">
                      {lead.score}
                    </div>
                    <div className="h-1 w-14 overflow-hidden bg-[#e2e7ec]">
                      <div
                        className="h-full bg-accent transition-[width] duration-300"
                        style={{ width: `${lead.score}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex px-1.5 py-0.5 text-[11px] font-semibold ${tierClass(lead.tier)}`}
                    >
                      {lead.tier}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[12px] text-muted">
        Showing {filteredLeads.length} of {leads.length} scored leads
      </p>
    </div>
  );
}
