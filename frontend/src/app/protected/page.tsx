'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAppPreferences } from '@/components/app-preferences';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { fetchCatalogGames } from '@/lib/catalog-client';
import { fetchMyGameRecords, formatRunDuration } from '@/lib/leaderboard-client';
import type { MyGameRecord } from '@/lib/leaderboard-client';
import { cn } from '@/lib/utils';

type StoredUser = {
  id?: string;
  username?: string;
  email?: string;
};

type GameRecordRow = MyGameRecord & { gameTitle: string };

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useAppPreferences();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [records, setRecords] = useState<GameRecordRow[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/login');
      return;
    }
    try {
      const raw = localStorage.getItem('user');
      setUser(raw ? (JSON.parse(raw) as StoredUser) : {});
    } catch {
      setUser({});
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingRecords(true);
      try {
        const [games, mine] = await Promise.all([fetchCatalogGames(), fetchMyGameRecords()]);
        const titleBySlug = new Map(games.map((g) => [g.slug, g.title]));
        const rows: GameRecordRow[] = mine.map((r) => ({
          ...r,
          gameTitle: titleBySlug.get(r.gameSlug) ?? r.gameSlug,
        }));
        if (!cancelled) setRecords(rows);
      } catch {
        if (!cancelled) setRecords([]);
      } finally {
        if (!cancelled) setLoadingRecords(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (user === null) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
        <p className="text-muted-foreground" role="status">
          {t('Checking session...', 'Verification de la session...')}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-8 sm:py-10">
      <Card className="border-sky-300/20 bg-slate-950/60">
        <CardHeader>
          <CardTitle className="space-etched text-2xl">
            {user.username ?? t('Player', 'Joueur')}
          </CardTitle>
          <CardDescription>
            {t('Public profile — visible to other players.', 'Profil public — visible par les autres joueurs.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-sky-300/15 bg-slate-900/40 p-3">
              <p className="text-xs uppercase text-muted-foreground">{t('Username', 'Pseudo')}</p>
              <p className="mt-1 font-medium">{user.username ?? '—'}</p>
            </div>
            <div className="rounded-lg border border-sky-300/15 bg-slate-900/40 p-3">
              <p className="text-xs uppercase text-muted-foreground">{t('Email', 'Email')}</p>
              <p className="mt-1 font-medium">{user.email ?? '—'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/settings" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              {t('Account settings', 'Parametres du compte')}
            </Link>
            <Link href="/catalog" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              {t('Play a game', 'Jouer')}
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Records by game', 'Records par jeu')}</CardTitle>
          <CardDescription>
            {t(
              'Your best score and fastest time per title.',
              'Ton meilleur score et ton meilleur temps par jeu.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRecords ? (
            <p className="text-sm text-muted-foreground">{t('Loading...', 'Chargement...')}</p>
          ) : records.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('No runs saved yet. Finish a game to appear here.', 'Aucune run enregistree. Termine une partie pour apparaitre ici.')}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {records.map((row) => (
                <li
                  key={row.gameSlug}
                  className="rounded-lg border border-sky-300/15 bg-slate-900/35 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sky-100/90">{row.gameTitle}</p>
                      <p className="text-xs text-muted-foreground">{row.gameSlug}</p>
                    </div>
                    <Link
                      href={`/play/${row.gameSlug}`}
                      className={cn(buttonVariants({ size: 'sm' }), 'shrink-0')}
                    >
                      {t('Play', 'Jouer')}
                    </Link>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <p>
                      {t('Best score', 'Meilleur score')}:{' '}
                      <span className="font-semibold text-zinc-100">{row.bestScore}</span>
                      {row.rankScore ? (
                        <span className="text-muted-foreground"> · Top {row.rankScore}</span>
                      ) : null}
                      <span className="block text-xs text-muted-foreground">
                        {formatRunDuration(row.bestScoreDuration)}
                      </span>
                    </p>
                    <p>
                      {t('Best time', 'Meilleur temps')}:{' '}
                      <span className="font-semibold text-zinc-100">
                        {formatRunDuration(row.bestTimeDuration)}
                      </span>
                      {row.rankTime ? (
                        <span className="text-muted-foreground"> · Top {row.rankTime}</span>
                      ) : null}
                      <span className="block text-xs text-muted-foreground">
                        {t('Score', 'Score')}: {row.bestTimeScore}
                      </span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Link href="/" className={cn(buttonVariants({ variant: 'link' }), 'h-auto p-0')}>
        {t('Back home', 'Retour accueil')}
      </Link>
    </main>
  );
}
