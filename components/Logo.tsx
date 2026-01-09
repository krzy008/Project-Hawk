import React from 'react';

export const Logo: React.FC = () => {
  return (
    <div className="w-full h-full relative group select-none flex items-center justify-center">
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full relative z-10 drop-shadow-[0_0_10px_rgba(255,163,26,0.3)]">
          {/* Main Head Shape - Sharp Anime Style */}
          <path 
            d="M 15 35 L 55 15 L 95 45 L 65 55 L 55 85 L 35 60 L 10 50 Z" 
            className="fill-hawk-base stroke-white stroke-[3]"
            strokeLinejoin="miter"
          />
          
          {/* Aggressive Beak Detail */}
          <path 
            d="M 95 45 L 65 55 L 75 48" 
            className="fill-hawk-gold/20 stroke-hawk-gold stroke-[2]" 
          />

          {/* Cyber Eye - Narrow & Angry */}
          <path 
            d="M 45 40 L 70 35 L 50 50 Z" 
            className="fill-hawk-gold drop-shadow-[0_0_8px_rgba(255,163,26,1)]" 
          />
          
          {/* Facial Markings / Cyber Lines */}
          <path 
            d="M 30 65 L 45 60 M 35 75 L 50 68" 
            className="stroke-hawk-textSecondary stroke-[2]" 
            strokeLinecap="square"
          />
      </svg>
    </div>
  );
};