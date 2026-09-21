"use client";

import { exportCrmCsv, exportCsv } from "@/lib/csv";
import type { Lead } from "@/lib/types";

type FiltersProps = {
  search: string;
  setSearch: (value: string) => void;
  tierFilter: string;
  setTierFilter: (value: string) => void;
  countryFilter: string;
  setCountryFilter: (value: string) => void;
  industryFilter: string;
  setIndustryFilter: (value: string) => void;
  hideInvalid: boolean;
  setHideInvalid: (value: boolean) => void;
  countries: string[];
  industries: string[];
  filteredLeads: Lead[];
};

export default function Filters({
  search,
  setSearch,
  tierFilter,
  setTierFilter,
  countryFilter,
  setCountryFilter,
  industryFilter,
  setIndustryFilter,
  hideInvalid,
  setHideInvalid,
  countries,
  industries,
  filteredLeads,
}: FiltersProps) {
  return (
    <div className="mb-4 min-w-0 space-y-3 border border-line bg-surface p-3">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <label htmlFor="search" className="mb-1 block text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
            Search
          </label>
          <input
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, company, email..."
            className="field"
          />
        </div>
        <div>
          <label htmlFor="tier" className="mb-1 block text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
            Tier
          </label>
          <select
            id="tier"
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="field"
          >
            <option value="all">All</option>
            <option value="Hot">Hot</option>
            <option value="Warm">Warm</option>
            <option value="Cold">Cold</option>
          </select>
        </div>
        <div>
          <label htmlFor="country" className="mb-1 block text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
            Country
          </label>
          <select
            id="country"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="field"
          >
            <option value="all">All</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="industry" className="mb-1 block text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
            Industry
          </label>
          <select
            id="industry"
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="field"
          >
            <option value="all">All</option>
            {industries.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <label className="flex items-center gap-2 text-[13px] text-muted">
          <input
            type="checkbox"
            checked={hideInvalid}
            onChange={(e) => setHideInvalid(e.target.checked)}
            className="border-border"
          />
          Hide invalid emails
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportCsv(filteredLeads)}
            disabled={filteredLeads.length === 0}
            className="btn btn-secondary"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => exportCrmCsv(filteredLeads)}
            disabled={filteredLeads.filter((l) => l.is_valid_email).length === 0}
            className="btn btn-secondary"
          >
            Export for CRM
          </button>
        </div>
      </div>
    </div>
  );
}
