export type Reason = {
  text: string;
  positive: boolean;
};

export type Lead = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  title: string;
  company: string;
  website: string;
  industry: string;
  employees: number | null;
  country: string;
  linkedin_url: string;
  company_domain: string;
  is_valid_email: boolean;
  is_free_email: boolean;
  is_role_email: boolean;
  missing_fields: string;
  score: number;
  tier: "Hot" | "Warm" | "Cold";
  reasons: Reason[];
};

export type ICP = {
  industries: string[];
  min_employees: number;
  max_employees: number;
  title_keywords: string[];
  countries: string[];
};

export type Stats = {
  total_loaded: number;
  duplicates_removed: number;
  invalid_emails: number;
  hot_leads: number;
  warm_leads: number;
  cold_leads: number;
};

export type ScoreResponse = {
  leads: Lead[];
  stats: Stats;
  insights: string[];
};

export type LoadResponse = {
  loaded: number;
  stored: number;
  duplicates_removed: number;
  invalid_emails: number;
};
