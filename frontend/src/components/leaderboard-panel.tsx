"use client";

import { LeaderboardEntry } from "../lib/leaderboard-client";

export function LeaderboardPanel({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <section aria-label="Leaderboard" className="rounded border p-4">
      <h2 className="text-lg font-semibold">Leaderboard</h2>
      {entries.length === 0 ? <p className="mt-2 text-sm">No scores yet.</p> : null}
      <ol className="mt-2 flex list-decimal flex-col gap-1 pl-6 text-sm">
        {entries.map((entry, index) => (
          <li key={`${entry.userId}-${index}`}>
            {entry.userId} - {entry.value}
          </li>
        ))}
      </ol>
    </section>
  );
}
