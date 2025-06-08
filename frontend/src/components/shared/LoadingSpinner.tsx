import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <ArrowPathIcon className={`animate-spin text-sky-600 ${sizeClasses[size]}`} />
      {text && <p className="mt-2 text-sm text-slate-600">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;