import type { Lead } from "./types";

export function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function tierClass(tier: Lead["tier"]): string {
  if (tier === "Hot") return "border border-[#b7d9c3] bg-[#e8f4ec] text-hot";
  if (tier === "Warm") return "border border-[#e6d0a8] bg-[#f7efdf] text-warm";
  return "border border-[#d0d5da] bg-[#f0f2f4] text-cold";
}
