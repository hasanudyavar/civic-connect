'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function RatingStars({ value, onChange, readonly = false, size = 'md' }: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverValue || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHoverValue(star)}
            onMouseLeave={() => !readonly && setHoverValue(0)}
            className={cn(
              'transition-all',
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-colors',
                isFilled
                  ? 'fill-[var(--primary)] text-[var(--primary)]'
                  : 'fill-transparent text-[rgba(255,255,255,0.15)]'
              )}
            />
          </button>
        );
      })}
      {value > 0 && (
        <span className="text-xs text-[var(--outline)] ml-1 font-medium">{value}/5</span>
      )}
    </div>
  );
}
