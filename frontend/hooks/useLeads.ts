"use client";

import { useState } from "react";

import {
  loadSampleLeads,
  scoreLeadsRequest,
  uploadLeadsCsv,
} from "@/lib/api";
import type { ICP, Lead, Stats } from "@/lib/types";
import { splitTags } from "@/lib/utils";

type UseLeadsArgs = {
  industriesInput: string;
  titleKeywordsInput: string;
  countriesInput: string;
  minEmployees: number;
  maxEmployees: number;
};

export function useLeads({
  industriesInput,
  titleKeywordsInput,
  countriesInput,
  minEmployees,
  maxEmployees,
}: UseLeadsArgs) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);

  function buildIcp(): ICP {
    return {
      industries: splitTags(industriesInput),
      min_employees: Number(minEmployees),
      max_employees: Number(maxEmployees),
      title_keywords: splitTags(titleKeywordsInput),
      countries: splitTags(countriesInput),
    };
  }

  async function scoreLeads() {
    setError(null);
    setLoadingAction("score");
    try {
      const data = await scoreLeadsRequest(buildIcp());
      setLeads(data.leads);
      setStats(data.stats);
      setInsights(data.insights);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to score leads");
    } finally {
      setLoadingAction(null);
    }
  }

  async function loadSample() {
    setError(null);
    setLoadMessage(null);
    setLoadingAction("sample");
    try {
      const data = await loadSampleLeads();
      setHasLoaded(true);
      setLeads([]);
      setStats(null);
      setInsights([]);
      setLoadMessage(
        `Loaded ${data.loaded} rows, stored ${data.stored} after removing ${data.duplicates_removed} duplicates.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sample leads");
    } finally {
      setLoadingAction(null);
    }
  }

  async function uploadCsv(file: File) {
    setError(null);
    setLoadMessage(null);
    setLoadingAction("upload");
    try {
      const data = await uploadLeadsCsv(file);
      setHasLoaded(true);
      setLeads([]);
      setStats(null);
      setInsights([]);
      setLoadMessage(
        `Uploaded ${data.loaded} rows, stored ${data.stored} after removing ${data.duplicates_removed} duplicates.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload CSV");
    } finally {
      setLoadingAction(null);
    }
  }

  return {
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
  };
}
