import type { Stats } from "@/lib/types";

type StatItemProps = {
  label: string;
  value: number;
  emphasize?: boolean;
};

function StatItem({ label, value, emphasize }: StatItemProps) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
        {label}
      </div>
      <div
        className={`mt-0.5 text-xl font-semibold tabular-nums tracking-tight ${
          emphasize ? "text-accent" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

type StatsBarProps = {
  stats: Stats | null;
  insights: string[];
};

export default function StatsBar({ stats, insights }: StatsBarProps) {
  if (!stats && insights.length === 0) return null;

  return (
    <div className="mb-4 space-y-3">
      {stats && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border border-line bg-surface px-3 py-3 sm:grid-cols-4 sm:px-4">
          <StatItem label="Total loaded" value={stats.total_loaded} />
          <StatItem label="Duplicates removed" value={stats.duplicates_removed} />
          <StatItem label="Invalid emails" value={stats.invalid_emails} />
          <StatItem label="Hot leads" value={stats.hot_leads} emphasize />
        </div>
      )}

      {insights.length > 0 && (
        <div className="border-l-2 border-accent bg-surface px-3 py-2">
          {insights.map((line) => (
            <p key={line} className="text-[13px] leading-snug text-muted">
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
