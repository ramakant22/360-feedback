import React, { useState } from 'react';
import { StarIcon as StarIconSolid } from '@heroicons/react/20/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';

interface StarInputProps {
  count: number;
  value: number;
  onChange: (rating: number) => void;
  size?: number; 
  color?: string;
  hoverColor?: string;
  disabled?: boolean;
}

const StarInput: React.FC<StarInputProps> = ({
  count,
  value,
  onChange,
  size = 24,
  color = "text-yellow-400", 
  hoverColor = "text-yellow-500", 
  disabled = false,
}) => {
  const [hoverValue, setHoverValue] = useState<number | undefined>(undefined);

  const stars = Array(count).fill(0);

  const handleClick = (newValue: number) => {
    if (disabled) return;
    onChange(newValue);
  };

  const handleMouseOver = (newHoverValue: number) => {
    if (disabled) return;
    setHoverValue(newHoverValue);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setHoverValue(undefined);
  };

  return (
    <div className={`flex items-center space-x-1 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
      {stars.map((_, index) => {
        const starValue = index + 1;
        const isFilled = (hoverValue !== undefined && !disabled ? hoverValue : value) >= starValue;
        
        return (
          <button
            type="button"
            key={index}
            className={`focus:outline-none transition-all duration-150 ease-in-out 
                        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer transform hover:scale-110'}`}
            onClick={() => handleClick(starValue)}
            onMouseOver={() => handleMouseOver(starValue)}
            onMouseLeave={handleMouseLeave}
            aria-label={`Rate ${starValue} out of ${count} stars`}
            aria-disabled={disabled}
            disabled={disabled}
          >
            {isFilled ? (
              <StarIconSolid 
                style={{ width: size, height: size }} 
                className={disabled ? 'text-slate-300' : (hoverValue !== undefined ? hoverColor : color)} 
              />
            ) : (
              <StarIconOutline 
                style={{ width: size, height: size }} 
                className={disabled ? 'text-slate-300' : (hoverValue !== undefined && hoverValue >= starValue ? hoverColor : 'text-slate-300')} 
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default StarInput;