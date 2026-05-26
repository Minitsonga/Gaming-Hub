'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LogOut, Settings, User } from 'lucide-react';

import { useAppPreferences } from '@/components/app-preferences';
import { logoutSession } from '@/lib/auth-logout';
import { cn } from '@/lib/utils';

import { buttonVariants } from './ui/button';

export function UserAccountMenu() {
  const router = useRouter();
  const { t } = useAppPreferences();
  const [hasToken, setHasToken] = useState(false);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setHasToken(Boolean(localStorage.getItem('accessToken')));
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('gaming-hub-auth', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('gaming-hub-auth', sync);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!hasToken) {
    return (
      <Link
        href="/login"
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'border-sky-200/20 bg-black/15 text-zinc-100 hover:bg-sky-500/15'
        )}
      >
        {t('Sign in', 'Connexion')}
      </Link>
    );
  }

  async function handleLogout() {
    setLoggingOut(true);
    await logoutSession();
    setOpen(false);
    setLoggingOut(false);
    router.replace('/login?loggedOut=1');
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'flex size-9 items-center justify-center rounded-full border border-sky-200/25',
          'bg-gradient-to-br from-slate-800 to-slate-950 text-sky-100/90',
          'shadow-[0_0_0_1px_rgba(56,189,248,0.15)_inset] transition-colors',
          'hover:border-sky-300/45 hover:bg-slate-800/90',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/70'
        )}
        title={t('Account menu', 'Menu compte')}
      >
        <User className="size-5" aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            'absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[11rem] rounded-lg border border-sky-300/20',
            'bg-slate-950/98 p-1 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-sm'
          )}
        >
          <Link
            href="/protected"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-100 hover:bg-sky-500/15"
            onClick={() => setOpen(false)}
          >
            <User className="size-4 opacity-80" aria-hidden />
            {t('Profile', 'Profil')}
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-100 hover:bg-sky-500/15"
            onClick={() => setOpen(false)}
          >
            <Settings className="size-4 opacity-80" aria-hidden />
            {t('Settings', 'Paramètres')}
          </Link>
          <button
            type="button"
            role="menuitem"
            disabled={loggingOut}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-60"
            onClick={() => void handleLogout()}
          >
            <LogOut className="size-4 opacity-80" aria-hidden />
            {loggingOut ? t('Signing out...', 'Déconnexion...') : t('Sign out', 'Déconnexion')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
