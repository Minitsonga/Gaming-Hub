'use client';

import Image from 'next/image';

import { isSameOriginThumbnail, normalizeThumbnailUrl } from '@/lib/thumbnail-url';
import { cn } from '@/lib/utils';

type GameThumbnailProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
};

export function GameThumbnail({
  src,
  alt,
  className,
  sizes = '(max-width: 768px) 100vw, 33vw',
}: GameThumbnailProps) {
  const normalized = normalizeThumbnailUrl(src);

  if (!normalized) {
    return <div className={cn('absolute inset-0 bg-slate-900/60', className)} aria-hidden />;
  }

  if (isSameOriginThumbnail(src) || normalized.startsWith('/')) {
    return (
      <img
        src={normalized}
        alt={alt}
        className={cn('absolute inset-0 h-full w-full object-cover', className)}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <Image
      src={normalized}
      alt={alt}
      className={cn('object-cover', className)}
      fill
      sizes={sizes}
    />
  );
}
