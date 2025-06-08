import React from 'react';

interface RatingDistributionChartProps {
  ratings: number[]; 
  maxRating?: number;
}

const RatingDistributionChart: React.FC<RatingDistributionChartProps> = ({ ratings, maxRating = 5 }) => {
  if (!ratings || ratings.length === 0) {
    return <p className="text-sm text-slate-500 italic">No rating data available for this question.</p>;
  }

  const ratingCounts = Array(maxRating + 1).fill(0);
  ratings.forEach(rating => {
    if (rating >= 1 && rating <= maxRating) {
      ratingCounts[rating]++;
    }
  });

  const totalRatings = ratings.length;
  const maxCount = Math.max(...ratingCounts, 1); 

  const barColors = [
    'bg-red-400',    
    'bg-orange-400', 
    'bg-yellow-400', 
    'bg-lime-400',   
    'bg-green-400',  
  ];
  
  const averageRating = totalRatings > 0 ? (ratings.reduce((sum, r) => sum + r, 0) / totalRatings).toFixed(1) : 'N/A';


  return (
    <div className="w-full">
      <div className="flex justify-end items-baseline space-x-3 mb-3 pr-1">
        {ratingCounts.slice(1).map((count, index) => { 
          const starValue = index + 1;
          const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
          const barHeight = totalRatings > 0 ? (count / maxCount) * 100 : 0; 

          return (
            <div key={starValue} className="flex flex-col items-center w-1/5">
              <div className="text-xs text-slate-500 mb-0.5 h-4 flex items-end">
                {count > 0 ? `${percentage.toFixed(0)}%` : ''}
              </div>
              <div 
                className={`w-3/4 md:w-1/2 rounded-t-sm transition-all duration-500 ease-out ${barColors[starValue-1] || 'bg-slate-300'}`}
                style={{ height: `${Math.max(barHeight, 5)}px` }} 
                title={`${count} vote(s) for ${starValue} star(s)`}
              ></div>
              <div className="text-xs font-medium text-slate-600 mt-1">{starValue}★</div>
            </div>
          );
        })}
      </div>
       <p className="text-xs text-slate-500 text-right mt-1">
        Average: <span className="font-semibold">{averageRating}</span> ({totalRatings} response{totalRatings !== 1 ? 's' : ''})
      </p>
    </div>
  );
};

export default RatingDistributionChart;