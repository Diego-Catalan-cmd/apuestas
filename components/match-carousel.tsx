"use client";

import React from "react";

export interface MatchItem {
  id: number | string;
  homeTeam: string;
  awayTeam: string;
  partido: string;
  liga: string;
  fecha: string;
  pronostico: string;
  cuota: number;
  probabilidad: number;
}

interface MatchCarouselProps {
  partidos: MatchItem[];
  onSelectMatch: (homeTeam: string, awayTeam: string) => void;
}

export default function MatchCarousel({ partidos, onSelectMatch }: MatchCarouselProps) {
  if (!partidos || partidos.length === 0) return null;

  return (
    <div className="w-full flex justify-center">
      <div className="flex items-center justify-center gap-3 overflow-x-auto py-1 px-1 w-full max-w-lg no-scrollbar">
        {partidos.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectMatch(item.homeTeam, item.awayTeam)}
            className="group relative shrink-0 w-[230px] sm:w-[240px] rounded-2xl p-3.5 bg-[#0D1F19]/60 hover:bg-[#132B23]/80 border border-[#278D7D]/25 hover:border-[#278D7D]/60 backdrop-blur-xl transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[#026747]/20 active:scale-[0.98]"
          >
            {/* ENCABEZADO TARJETA */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-200/60 truncate">
                {item.liga}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#026747]/40 border border-[#278D7D]/40 text-[#4ADE80] text-[9px] font-bold shrink-0">
                {item.probabilidad}% PROB.
              </span>
            </div>

            {/* PARTIDO */}
            <div className="space-y-0.5 mb-2.5">
              <div className="text-[10px] text-emerald-100/50 font-medium">
                📅 {item.fecha}
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#278D7D] transition-colors truncate">
                {item.partido}
              </h4>
            </div>

            {/* PRONÓSTICO Y CUOTA */}
            <div className="flex items-center justify-between pt-2 border-t border-[#278D7D]/20 bg-[#06130E]/60 -mx-3.5 -mb-3.5 p-2.5 rounded-b-2xl">
              <span className="text-[11px] font-semibold text-emerald-100/80 truncate">
                {item.pronostico}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-black shrink-0">
                @{item.cuota.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}