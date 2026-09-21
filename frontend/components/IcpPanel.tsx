"use client";

import { useRef } from "react";

type IcpPanelProps = {
  industriesInput: string;
  setIndustriesInput: (value: string) => void;
  titleKeywordsInput: string;
  setTitleKeywordsInput: (value: string) => void;
  countriesInput: string;
  setCountriesInput: (value: string) => void;
  minEmployees: number;
  setMinEmployees: (value: number) => void;
  maxEmployees: number;
  setMaxEmployees: (value: number) => void;
  loadingAction: string | null;
  hasLoaded: boolean;
  loadMessage: string | null;
  error: string | null;
  onLoadSample: () => void;
  onUploadCsv: (file: File) => void;
  onScoreLeads: () => void;
};

export default function IcpPanel({
  industriesInput,
  setIndustriesInput,
  titleKeywordsInput,
  setTitleKeywordsInput,
  countriesInput,
  setCountriesInput,
  minEmployees,
  setMinEmployees,
  maxEmployees,
  setMaxEmployees,
  loadingAction,
  hasLoaded,
  loadMessage,
  error,
  onLoadSample,
  onUploadCsv,
  onScoreLeads,
}: IcpPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <aside className="h-fit w-full min-w-0 border border-border bg-panel">
      <div className="border-b border-line bg-[#f5f7f9] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          Step 1
        </p>
        <h2 className="text-sm font-semibold tracking-tight">Ideal customer profile</h2>
      </div>

      <div className="space-y-3.5 p-4">
        <div>
          <label htmlFor="industries" className="mb-1 block text-[13px] font-medium">
            Target industries
          </label>
          <input
            id="industries"
            value={industriesInput}
            onChange={(e) => setIndustriesInput(e.target.value)}
            className="field"
            placeholder="SaaS, Fintech"
          />
          <p className="mt-1 text-[11px] text-muted">Comma separated</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="minEmployees" className="mb-1 block text-[13px] font-medium">
              Min employees
            </label>
            <input
              id="minEmployees"
              type="number"
              min={1}
              value={minEmployees}
              onChange={(e) => setMinEmployees(Number(e.target.value))}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="maxEmployees" className="mb-1 block text-[13px] font-medium">
              Max employees
            </label>
            <input
              id="maxEmployees"
              type="number"
              min={1}
              value={maxEmployees}
              onChange={(e) => setMaxEmployees(Number(e.target.value))}
              className="field"
            />
          </div>
        </div>

        <div>
          <label htmlFor="titles" className="mb-1 block text-[13px] font-medium">
            Job title keywords
          </label>
          <input
            id="titles"
            value={titleKeywordsInput}
            onChange={(e) => setTitleKeywordsInput(e.target.value)}
            className="field"
            placeholder="founder, ceo, head of"
          />
        </div>

        <div>
          <label htmlFor="countries" className="mb-1 block text-[13px] font-medium">
            Target countries
          </label>
          <input
            id="countries"
            value={countriesInput}
            onChange={(e) => setCountriesInput(e.target.value)}
            className="field"
            placeholder="United States, Canada"
          />
        </div>
      </div>

      <div className="border-t border-line p-4">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          Step 2
        </p>
        <h3 className="mb-3 text-sm font-semibold tracking-tight">Lead input</h3>
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onLoadSample}
            disabled={loadingAction !== null}
            className="btn btn-secondary w-full"
          >
            {loadingAction === "sample" ? "Loading sample..." : "Load sample leads"}
          </button>
          <div>
            <label htmlFor="csvUpload" className="mb-1 block text-[13px] font-medium">
              Upload CSV
            </label>
            <input
              id="csvUpload"
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              disabled={loadingAction !== null}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onUploadCsv(file);
                  if (fileRef.current) fileRef.current.value = "";
                }
              }}
              className="block w-full text-[13px] text-muted file:mr-3 file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-[13px] file:font-semibold file:text-foreground hover:file:bg-[#f3f5f7]"
            />
          </div>
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            Step 3
          </p>
          <button
            type="button"
            onClick={onScoreLeads}
            disabled={loadingAction !== null || !hasLoaded}
            className="btn btn-primary mt-2 w-full py-2.5"
          >
            {loadingAction === "score" ? "Scoring..." : "Score leads"}
          </button>
          {!hasLoaded && (
            <p className="mt-2 text-[11px] text-muted">
              Load sample leads or upload a CSV first.
            </p>
          )}
        </div>
      </div>

      {loadMessage && (
        <p className="mx-4 mb-4 border border-[#b7d9c3] bg-[#e8f4ec] px-3 py-2 text-[13px] text-hot">
          {loadMessage}
        </p>
      )}
      {error && (
        <p
          className="mx-4 mb-4 border border-[#e2b4b4] bg-[#f8ecec] px-3 py-2 text-[13px] text-[#8b2e2e]"
          role="alert"
        >
          {error}
        </p>
      )}
    </aside>
  );
}
