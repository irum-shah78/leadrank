"use client";

import { useMemo, useState } from "react";

import Filters from "@/components/Filters";
import IcpPanel from "@/components/IcpPanel";
import LeadsTable from "@/components/LeadsTable";
import StatsBar from "@/components/StatsBar";
import { useLeads } from "@/hooks/useLeads";

export default function HomePage() {
  const [industriesInput, setIndustriesInput] = useState("SaaS, Fintech");
  const [titleKeywordsInput, setTitleKeywordsInput] = useState(
    "founder, ceo, head of"
  );
  const [countriesInput, setCountriesInput] = useState(
    "United States, Canada, United Kingdom"
  );
  const [minEmployees, setMinEmployees] = useState(5);
  const [maxEmployees, setMaxEmployees] = useState(200);

  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [hideInvalid, setHideInvalid] = useState(false);

  const {
    leads,
    stats,
    insights,
    hasLoaded,
    loadingAction,
    error,
    loadMessage,
    loadSample,
    uploadCsv,
    scoreLeads,
  } = useLeads({
    industriesInput,
    titleKeywordsInput,
    countriesInput,
    minEmployees,
    maxEmployees,
  });

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if ((lead.country || "").toLowerCase() === "israel") return false;
      if (tierFilter !== "all" && lead.tier !== tierFilter) return false;
      if (countryFilter !== "all" && lead.country !== countryFilter) return false;
      if (industryFilter !== "all" && lead.industry !== industryFilter)
        return false;
      if (hideInvalid && !lead.is_valid_email) return false;
      if (!q) return true;
      const hay = [
        lead.first_name,
        lead.last_name,
        lead.email,
        lead.title,
        lead.company,
        lead.industry,
        lead.country,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [leads, search, tierFilter, countryFilter, industryFilter, hideInvalid]);

  const countries = useMemo(
    () =>
      Array.from(
        new Set(
          leads
            .map((l) => l.country)
            .filter((c) => Boolean(c) && c.toLowerCase() !== "israel")
        )
      ).sort(),
    [leads]
  );
  const industries = useMemo(
    () =>
      Array.from(new Set(leads.map((l) => l.industry).filter(Boolean))).sort(),
    [leads]
  );

  const showWorkspace = hasLoaded || leads.length > 0 || !!stats;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-3 py-3 sm:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center border border-accent bg-accent text-sm font-bold tracking-tight text-white"
              aria-hidden
            >
              LR
            </div>
            <div className="min-w-0">
              <h1 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-foreground">
                LeadRank
              </h1>
              <p className="truncate text-[13px] text-muted">
                Prioritize outreach against your ICP
              </p>
            </div>
          </div>
          <ol className="hidden items-center gap-4 text-[12px] text-muted lg:flex">
            <li className="flex items-center gap-1.5">
              <span className="font-semibold text-accent">1</span> Set ICP
            </li>
            <li className="h-px w-5 bg-border" aria-hidden />
            <li className="flex items-center gap-1.5">
              <span className="font-semibold text-accent">2</span> Load leads
            </li>
            <li className="h-px w-5 bg-border" aria-hidden />
            <li className="flex items-center gap-1.5">
              <span className="font-semibold text-accent">3</span> Score
            </li>
          </ol>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-4 px-3 py-4 sm:gap-5 sm:px-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-6">
        <IcpPanel
          industriesInput={industriesInput}
          setIndustriesInput={setIndustriesInput}
          titleKeywordsInput={titleKeywordsInput}
          setTitleKeywordsInput={setTitleKeywordsInput}
          countriesInput={countriesInput}
          setCountriesInput={setCountriesInput}
          minEmployees={minEmployees}
          setMinEmployees={setMinEmployees}
          maxEmployees={maxEmployees}
          setMaxEmployees={setMaxEmployees}
          loadingAction={loadingAction}
          hasLoaded={hasLoaded}
          loadMessage={loadMessage}
          error={error}
          onLoadSample={() => void loadSample()}
          onUploadCsv={(file) => void uploadCsv(file)}
          onScoreLeads={() => void scoreLeads()}
        />

        <section className="min-w-0 animate-fade-up border border-border bg-panel">
          {!showWorkspace ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-4 py-10 text-center sm:min-h-[460px] sm:px-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                Sales queue
              </p>
              <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] sm:text-xl">
                Load a list, then score who to call first
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                Use the panel on the left. Load sample leads or upload a CSV,
                set your ICP, then click Score leads. Hot contacts rise to the top
                with clear reasons.
              </p>
              <div className="mt-6 grid w-full max-w-sm gap-2 text-left text-sm text-muted">
                <div className="border border-line bg-surface px-3 py-2">
                  <span className="font-semibold text-foreground">1.</span> Define industries, titles, size, countries
                </div>
                <div className="border border-line bg-surface px-3 py-2">
                  <span className="font-semibold text-foreground">2.</span> Load sample or upload your CSV
                </div>
                <div className="border border-line bg-surface px-3 py-2">
                  <span className="font-semibold text-foreground">3.</span> Score and export Hot leads to CRM
                </div>
              </div>
            </div>
          ) : (
            <div className="min-w-0 p-3 sm:p-5">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-line pb-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold tracking-tight">Ranked results</h2>
                  <p className="text-[13px] text-muted">
                    {leads.length > 0
                      ? "Sorted by score. Filter, then export the working set."
                      : "Leads are stored. Click Score leads to rank them."}
                  </p>
                </div>
              </div>
              <StatsBar stats={stats} insights={insights} />
              {leads.length > 0 && (
                <Filters
                  search={search}
                  setSearch={setSearch}
                  tierFilter={tierFilter}
                  setTierFilter={setTierFilter}
                  countryFilter={countryFilter}
                  setCountryFilter={setCountryFilter}
                  industryFilter={industryFilter}
                  setIndustryFilter={setIndustryFilter}
                  hideInvalid={hideInvalid}
                  setHideInvalid={setHideInvalid}
                  countries={countries}
                  industries={industries}
                  filteredLeads={filteredLeads}
                />
              )}
              <LeadsTable
                leads={leads}
                filteredLeads={filteredLeads}
                loadingAction={loadingAction}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
