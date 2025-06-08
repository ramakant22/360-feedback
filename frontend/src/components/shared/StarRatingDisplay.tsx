import React from 'react';
import { StarIcon as StarIconSolid } from '@heroicons/react/20/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';

interface StarRatingDisplayProps {
  rating: number;
  totalStars?: number;
  size?: number; 
  color?: string;
}

const StarRatingDisplay: React.FC<StarRatingDisplayProps> = ({
  rating,
  totalStars = 5,
  size = 20,
  color = "text-yellow-400",
}) => {
  return (
    <div className="flex items-center">
      {Array.from({ length: totalStars }, (_, index) => {
        const starValue = index + 1;
        return (
          <span key={index} className={`inline-block ${color}`} style={{ width: size, height: size }}>
            {starValue <= Math.round(rating) ? (
              <StarIconSolid className="w-full h-full" />
            ) : (
              <StarIconOutline className="w-full h-full text-slate-300" />
            )}
          </span>
        );
      })}
      <span className="ml-2 text-sm text-slate-600 font-medium">{rating.toFixed(1)} / {totalStars}</span>
    </div>
  );
};

export default StarRatingDisplay;