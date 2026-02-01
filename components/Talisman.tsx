
import React from 'react';
import { OracleResponse } from '../types';

interface TalismanProps {
  data: OracleResponse;
}

const Talisman: React.FC<TalismanProps> = ({ data }) => {
  return (
    <div className="relative w-72 md:w-80 aspect-[4/5] snow-card p-8 flex flex-col items-center justify-between animate-drift mx-auto overflow-hidden">
      {/* Fluffy Border Decoration */}
      <div className="absolute top-0 left-0 w-full h-4 bg-blue-50/50"></div>
      
      {/* Title */}
      <div className="z-10 text-blue-900 font-bold text-2xl tracking-tight mb-2 text-center">
        ❄️ {data.title} ❄️
      </div>

      {/* The Big Character in a Snowball */}
      <div className="z-10 w-32 h-32 bg-sky-100 rounded-full border-4 border-white shadow-inner flex items-center justify-center text-sky-600 text-6xl" 
           style={{ fontFamily: 'Zhi Mang Xing, cursive' }}>
        {data.talismanChar}
      </div>

      {/* Cute Poem Lines */}
      <div className="z-10 space-y-2 text-center">
        {data.poem.map((line, idx) => (
          <p key={idx} className="text-blue-800/80 font-medium text-sm leading-relaxed italic">
            {line}
          </p>
        ))}
      </div>

      {/* Bottom Paw Print or Seal */}
      <div className="z-10 mt-4 text-sky-300 text-xs font-bold uppercase tracking-widest">
        Windfu's Snow Blessing
      </div>
      
      {/* Background Fluff */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-50 rounded-full opacity-50 blur-xl"></div>
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-50 rounded-full opacity-50 blur-xl"></div>
    </div>
  );
};

export default Talisman;
