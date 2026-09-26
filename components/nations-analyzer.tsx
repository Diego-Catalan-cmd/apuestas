"use client";

import React, { useState } from "react";
import { Trophy, Globe, Flame, AlertCircle } from "lucide-react";

export default function NationsAnalyzer() {
  const [equipoLocal, setEquipoLocal] = useState("");
  const [equipoVisitante, setEquipoVisitante] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalizarNations = async () => {
    if (!equipoLocal.trim() || !equipoVisitante.trim()) {
      setError("Por favor ingresa ambos equipos de la selección.");
      return;
    }

    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const res = await fetch("/api/analyze-nations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partidos: [
            { homeTeam: equipoLocal, awayTeam: equipoVisitante, tournament: "UEFA Nations League" },
          ],
        }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        setResultado(data.data);
      } else {
        setError(data.error || "No se pudo generar el análisis.");
      }
    } catch (err: any) {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative rounded-2xl sm:rounded-3xl p-5 sm:p-7 bg-[#0D1F19]/90 border border-[#278D7D]/30 shadow-2xl space-y-6 w-full max-w-2xl">
      {/* CABECERA */}
      <div className="flex items-center justify-between pb-3 border-b border-[#278D7D]/20">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
            Especial Nations League & Selecciones
          </h2>
        </div>
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold flex items-center gap-1">
          <Globe className="w-3 h-3" /> Fecha FIFA
        </span>
      </div>

      {/* INPUTS DE EQUIPOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-emerald-200/80 block mb-1">Selección Local</label>
          <input
            type="text"
            placeholder="Ej: España"
            value={equipoLocal}
            onChange={(e) => setEquipoLocal(e.target.value)}
            className="w-full bg-[#06130E] border border-[#278D7D]/30 focus:border-[#278D7D] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-emerald-900 outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-emerald-200/80 block mb-1">Selección Visitante</label>
          <input
            type="text"
            placeholder="Ej: Italia"
            value={equipoVisitante}
            onChange={(e) => setEquipoVisitante(e.target.value)}
            className="w-full bg-[#06130E] border border-[#278D7D]/30 focus:border-[#278D7D] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-emerald-900 outline-none"
          />
        </div>
      </div>

      {/* BOTÓN DE ACCIÓN */}
      <button
        onClick={handleAnalizarNations}
        disabled={loading}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-emerald-700 to-[#026747] hover:brightness-110 font-bold text-xs sm:text-sm text-white transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Evaluando Química & Contexto FIFA...</span>
          </div>
        ) : (
          <>
            <Flame className="w-4 h-4 text-amber-300" />
            <span>Analizar Partido de Selecciones</span>
          </>
        )}
      </button>

      {/* ERROR */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* RESULTADOS */}
      {resultado && resultado.cupon_analisis && (
        <div className="space-y-4 pt-2 border-t border-[#278D7D]/20">
          {resultado.cupon_analisis.map((item: any, idx: number) => (
            <div key={idx} className="p-4 rounded-xl bg-[#06130E]/80 border border-[#278D7D]/30 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-white">{item.partido}</h3>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Nations League
                </span>
              </div>

              <p className="text-xs text-emerald-100/70 leading-relaxed">{item.analisis_contextual}</p>

              {item.pronosticos?.map((p: any, pIdx: number) => (
                <div key={pIdx} className="p-3 rounded-lg bg-[#0D1F19] border border-[#278D7D]/20 space-y-1">
                  <div className="flex justify-between text-xs font-bold text-emerald-300">
                    <span>🎯 {p.pronostico_sugerido}</span>
                    <span>{p.probabilidad_estimada}% Prob.</span>
                  </div>
                  <p className="text-[11px] text-emerald-400/80">{p.justificacion}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}