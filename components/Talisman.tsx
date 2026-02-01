
import React from 'react';
import { OracleResponse } from '../types';

interface TalismanProps {
  data: OracleResponse;
}

const Talisman: React.FC<TalismanProps> = ({ data }) => {
  return (
    <div className="relative w-64 md:w-80 aspect-[1/2] paper-texture rounded-lg shadow-2xl p-6 flex flex-col items-center justify-between border-4 border-red-900 animate-float mx-auto overflow-hidden">
      {/* Decorative Border */}
      <div className="absolute inset-2 border border-red-800 opacity-30 pointer-events-none"></div>
      
      {/* Header Title */}
      <div className="z-10 text-red-900 font-bold text-2xl tracking-widest mt-4" style={{ fontFamily: 'Ma Shan Zheng, cursive' }}>
        {data.title}
      </div>

      {/* Main Talisman Character */}
      <div className="z-10 text-red-700 text-9xl select-none flex items-center justify-center" style={{ fontFamily: 'Zhi Mang Xing, cursive' }}>
        {data.talismanChar}
      </div>

      {/* Vertical Poem */}
      <div className="z-10 flex flex-row-reverse gap-4 writing-vertical h-48 mb-8 text-red-900 opacity-80">
        {data.poem.map((line, idx) => (
          <p key={idx} className="text-sm font-medium leading-relaxed">{line}</p>
        ))}
      </div>

      {/* Seal Seal */}
      <div className="absolute bottom-4 right-4 w-12 h-12 border-2 border-red-700 flex items-center justify-center text-red-700 font-bold transform -rotate-12 bg-transparent">
        <span className="text-[10px] leading-tight text-center">WINDFU<br/>ORACLE</span>
      </div>
    </div>
  );
};

export default Talisman;
