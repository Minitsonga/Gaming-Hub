'use client';

import { useCallback, useRef, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type GameCarouselProps = {
  children: ReactNode;
  ariaLabel: string;
  className?: string;
};

export function GameCarousel({ children, ariaLabel, className }: GameCarouselProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>('[data-carousel-item]');
    const step = (first?.offsetWidth ?? 300) + 16;
    el.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' });
  }, []);

  return (
    <div
      className={cn('flex items-center gap-2 sm:gap-3', className)}
      aria-label={ariaLabel}
    >
      <Button
        type="button"
        size="icon"
        variant="outline"
        onClick={() => scroll('left')}
        aria-label={`${ariaLabel} — previous`}
        className="carousel-arrow size-10 shrink-0"
      >
        <ChevronLeft className="size-5" />
      </Button>

      <div
        ref={scrollRef}
        className={cn(
          'no-scrollbar min-w-0 flex-1 snap-x snap-mandatory',
          'flex gap-4 overflow-x-auto overflow-y-visible',
          'scroll-smooth py-2',
          'scroll-px-1'
        )}
      >
        {children}
      </div>

      <Button
        type="button"
        size="icon"
        variant="outline"
        onClick={() => scroll('right')}
        aria-label={`${ariaLabel} — next`}
        className="carousel-arrow size-10 shrink-0"
      >
        <ChevronRight className="size-5" />
      </Button>
    </div>
  );
}

export function gameCarouselItemClassName() {
  return cn(
    'snap-start shrink-0',
    'w-[min(100%,280px)] sm:w-[300px] md:w-[320px]',
    'scroll-ml-0'
  );
}
