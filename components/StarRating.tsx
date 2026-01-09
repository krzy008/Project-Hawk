import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 0 to 10
  max?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  max = 10, 
  interactive = false, 
  onRate,
  size = 'md'
}) => {
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  if (!interactive) {
    // Compact display for cards
    return (
      <div className="flex items-center gap-1.5 text-hawk-gold font-medium">
        <Star className={`${iconSize} fill-hawk-gold text-hawk-gold`} strokeWidth={0} />
        <span className="text-sm tracking-tight">{rating > 0 ? rating : '-'}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate && onRate(star)}
          className={`transition-all duration-200 ${interactive ? 'hover:scale-110' : ''}`}
        >
          <Star 
            className={`${iconSize} ${
              star <= rating 
                ? 'fill-hawk-gold text-hawk-gold drop-shadow-[0_0_4px_rgba(212,175,55,0.4)]' 
                : 'text-zinc-800 fill-zinc-900'
            }`} 
            strokeWidth={star <= rating ? 0 : 1.5}
          />
        </button>
      ))}
    </div>
  );
};