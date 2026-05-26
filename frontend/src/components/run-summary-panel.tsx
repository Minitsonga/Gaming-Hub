"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RunEndedPayload } from "@/lib/game-bridge";
import { formatRunDuration } from "@/lib/leaderboard-client";

type RunSummaryPanelProps = {
  summary: RunEndedPayload;
  t: (en: string, fr: string) => string;
};

export function RunSummaryPanel({ summary, t }: RunSummaryPanelProps) {
  return (
    <Card className="border-sky-300/20 bg-slate-950/62 shadow-[0_8px_28px_rgba(0,0,0,0.35)]">
      <CardHeader>
        <CardTitle className="space-etched text-lg">{t("Run summary", "Résumé de la run")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
        <p>
          {t("Level", "Niveau")}: {summary.levelReached} · {t("Score", "Score")}: {summary.score}
        </p>
        <p>
          {t("XP", "XP")}: {summary.totalXP} · {t("Kills", "Tués")}: {summary.enemiesKilled}
        </p>
        <p>
          {t("Xyst earned", "Xyst gagnés")}: {summary.xystEarned} · {t("Total Xyst", "Xyst total")}:{" "}
          {summary.totalXyst}
        </p>
        <p>
          {t("Duration", "Durée")}: {formatRunDuration(summary.runDuration)}
        </p>
        {summary.skillsAcquired.length > 0 ? (
          <ul className="sm:col-span-2">
            <li className="font-medium">{t("Skills acquired", "Skills acquis")}</li>
            {summary.skillsAcquired.map((line) => (
              <li key={line} className="text-muted-foreground">
                {line}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
