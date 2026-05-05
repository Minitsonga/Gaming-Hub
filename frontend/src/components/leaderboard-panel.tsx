"use client";

import { LeaderboardEntry } from "../lib/leaderboard-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LeaderboardPanel({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <Card aria-label="Leaderboard">
      <CardHeader>
        <CardTitle className="text-lg">Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
      {entries.length === 0 ? <p className="text-sm text-muted-foreground">No scores yet.</p> : null}
      <ol className="flex list-decimal flex-col gap-1 pl-6 text-sm">
        {entries.map((entry, index) => (
          <li key={`${entry.userId}-${index}`}>
            {entry.userId} - {entry.value}
          </li>
        ))}
      </ol>
      </CardContent>
    </Card>
  );
}
