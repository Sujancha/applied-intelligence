"use client";

import { useState } from "react";
import Link from "next/link";
import type { Profile } from "@/types";

const TRACKED_FIELDS: (keyof Profile)[] = [
  "job_title",
  "industry",
  "business_type",
  "target_clients",
  "sport",
  "team_role",
  "team_name",
  "reading_genres",
  "why_i_read",
];

function calcCompletion(profile: Profile): number {
  const filled = TRACKED_FIELDS.filter((field) => {
    const val = profile[field];
    if (Array.isArray(val)) return val.length > 0;
    return val !== null && val !== undefined && String(val).trim() !== "";
  }).length;
  return Math.round((filled / TRACKED_FIELDS.length) * 100);
}

export function ProfileCompletionBanner({ profile }: { profile: Profile }) {
  const [dismissed, setDismissed] = useState(false);
  const pct = calcCompletion(profile);

  if (dismissed || pct >= 70) return null;

  return (
    <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-6 py-2.5">
      <p className="text-sm text-amber-800">
        Your profile is <strong>{pct}%</strong> complete. More context = better
        AI results.{" "}
        <Link
          href="/settings/profile"
          className="font-medium underline underline-offset-2"
        >
          Complete your profile
        </Link>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="ml-4 shrink-0 text-amber-600 hover:text-amber-900"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
