import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;

  return (
    <div className="w-full bg-hawk-ui rounded-full h-[3px] overflow-hidden mt-2">
      <div 
        className="bg-hawk-goldLight h-full"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};