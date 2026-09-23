"use client";

import React, { useState, useEffect } from "react";
import BettingAnalyzer from "@/components/betting-analyzer";
import LiveAnalyzer from "@/components/live-analyzer";
import MatchCarousel, { MatchItem } from "@/components/match-carousel";
import { Calendar, Flame, Loader2 } from "lucide-react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"prematch" | "live">("prematch");
  const [selectedMatchToAdd, setSelectedMatchToAdd] = useState<{
    homeTeam: string;
    awayTeam: string;
  } | null>(null);

  const [partidosDestacados, setPartidosDestacados] = useState<MatchItem[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  useEffect(() => {
    async function loadFeaturedMatches() {
      try {
        setLoadingMatches(true);
        const res = await fetch("/api/featured-matches");
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          setPartidosDestacados(data.data);
        }
      } catch (error) {
        console.error("Error al cargar partidos de la API:", error);
      } finally {
        setLoadingMatches(false);
      }
    }

    loadFeaturedMatches();
  }, []);

  const handleSelectMatchFromCarousel = (homeTeam: string, awayTeam: string) => {
    if (activeTab !== "prematch") {
      setActiveTab("prematch");
    }
    setSelectedMatchToAdd({ homeTeam, awayTeam });
  };

  return (
    <main className="relative min-h-screen w-full bg-[#06130E] text-white flex flex-col items-center justify-start px-4 sm:px-8 py-8 overflow-x-hidden font-sans">
      
      {/* ORBES DE LUZ AMBIENTAL EN TONOS JADE */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-[#026747]/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-[#278D7D]/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl space-y-8 flex flex-col items-center">
        
        {/* CARRUSEL DE PRONÓSTICOS DESTACADOS */}
        <div className="w-full max-w-lg mx-auto space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/80">
              <Flame className="w-4 h-4 text-[#278D7D] animate-pulse" />
              <span>Pronósticos de Alto Valor (IA)</span>
            </div>
            <span className="text-[11px] text-emerald-500/60 hidden sm:inline">
              Toca para agregar
            </span>
          </div>

          {loadingMatches ? (
            <div className="flex items-center justify-center p-8 bg-[#0D1F19]/50 border border-[#278D7D]/20 rounded-2xl text-emerald-300/70 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#278D7D]" />
              <span>Cargando partidos de la API...</span>
            </div>
          ) : (
            <MatchCarousel
              partidos={partidosDestacados}
              onSelectMatch={handleSelectMatchFromCarousel}
            />
          )}
        </div>

        {/* NAVEGACIÓN POR PESTAÑAS */}
        <div className="flex p-1.5 rounded-2xl bg-[#0D1F19]/80 border border-[#278D7D]/20 backdrop-blur-xl shadow-xl w-full max-w-md mx-auto">
          <button
            onClick={() => setActiveTab("prematch")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
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
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeTab === "live"
                ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                : "text-emerald-200/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span>En Vivo (In-Play)</span>
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="w-full flex justify-center">
          {activeTab === "prematch" ? (
            <BettingAnalyzer externalMatchToAdd={selectedMatchToAdd} />
          ) : (
            <LiveAnalyzer />
          )}
        </div>

      </div>
    </main>
  );
}