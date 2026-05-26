'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAppPreferences } from '@/components/app-preferences';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const router = useRouter();
  const { language, setLanguage, t } = useAppPreferences();

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.replace('/login?next=/settings');
    }
  }, [router]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8 sm:py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="space-etched text-2xl font-semibold">{t('Settings', 'Paramètres')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('Preferences and account', 'Préférences et compte')}
          </p>
        </div>
        <Link href="/protected" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          {t('Back to profile', 'Retour au profil')}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Preferences', 'Préférences')}</CardTitle>
          <CardDescription>
            {t('Interface language for the hub.', 'Langue de l’interface du hub.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <label htmlFor="language-select" className="text-sm text-muted-foreground">
            {t('Language', 'Langue')}
          </label>
          <Select
            value={language.toUpperCase()}
            onValueChange={(v) => {
              if (v === 'EN' || v === 'FR') setLanguage(v.toLowerCase() as 'en' | 'fr');
            }}
          >
            <SelectTrigger id="language-select" className="w-[8rem]" aria-label={t('Language', 'Langue')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EN">English</SelectItem>
              <SelectItem value="FR">Français</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Account', 'Compte')}</CardTitle>
          <CardDescription>
            {t('Password, email and data (coming soon).', 'Mot de passe, email et données (bientôt).')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>{t('Change password — coming soon', 'Changer le mot de passe — bientôt')}</p>
          <p>{t('Update email — coming soon', 'Modifier l’email — bientôt')}</p>
          <p>{t('Delete account & data — coming soon', 'Supprimer le compte et les données — bientôt')}</p>
          <p className="pt-2 text-xs">
            {t('Sign out from the avatar menu in the header.', 'Déconnecte-toi via le menu avatar en haut.')}
          </p>
        </CardContent>
      </Card>

      <Separator />
      <Link href="/" className={cn(buttonVariants({ variant: 'link' }), 'h-auto p-0')}>
        {t('Back home', 'Retour accueil')}
      </Link>
    </main>
  );
}
