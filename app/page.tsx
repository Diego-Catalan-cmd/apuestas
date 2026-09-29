"use client";

import React, { useState } from "react";
import BettingAnalyzer from "@/components/betting-analyzer";
import { LiveAnalyzer } from "@/components/live-analyzer";
import NationsAnalyzer from "@/components/nations-analyzer";
import { Calendar, Trophy } from "lucide-react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"prematch" | "live" | "nations">("prematch");

  return (
    <main className="relative min-h-screen w-full bg-[#06130E] text-white flex flex-col items-center justify-start px-4 sm:px-8 py-8 overflow-x-hidden font-sans">
      {/* ORBES DE LUZ AMBIENTAL EN TONOS JADE */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-[#026747]/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-[#278D7D]/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl space-y-8 flex flex-col items-center">
        {/* NAVEGACIÓN POR PESTAÑAS */}
        <div className="flex p-1.5 rounded-2xl bg-[#0D1F19]/80 border border-[#278D7D]/20 backdrop-blur-xl shadow-xl w-full max-w-lg mx-auto gap-1">
          <button
            onClick={() => setActiveTab("prematch")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeTab === "prematch"
                ? "bg-gradient-to-r from-[#026747] to-[#278D7D] text-white shadow-lg shadow-[#026747]/40"
                : "text-emerald-200/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Pre-Partido</span>
          </button>

          <button
            onClick={() => setActiveTab("live")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeTab === "live"
                ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                : "text-emerald-200/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span>En Vivo</span>
          </button>

          <button
            onClick={() => setActiveTab("nations")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeTab === "nations"
                ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-600/30"
                : "text-emerald-200/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>Nations League</span>
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="w-full flex justify-center">
          {activeTab === "prematch" && <BettingAnalyzer />}
          {activeTab === "live" && <LiveAnalyzer />}
          {activeTab === "nations" && <NationsAnalyzer />}
        </div>
      </div>
    </main>
  );
}