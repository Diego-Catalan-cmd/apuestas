"use client";

import React, { useState } from "react";
import { Trophy, Globe, Flame, AlertCircle, Plus, Trash2 } from "lucide-react";

export default function NationsAnalyzer() {
  const [partidos, setPartidos] = useState<Array<{ homeTeam: string; awayTeam: string }>>([
    { homeTeam: "", awayTeam: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Agregar una nueva fila de partido
  const addPartido = () => {
    setPartidos([...partidos, { homeTeam: "", awayTeam: "" }]);
  };

  // Quitar un partido de la lista
  const removePartido = (index: number) => {
    if (partidos.length > 1) {
      setPartidos(partidos.filter((_, i) => i !== index));
    }
  };

  // Actualizar el valor de un campo específico
  const updatePartido = (index: number, field: "homeTeam" | "awayTeam", value: string) => {
    const updated = [...partidos];
    updated[index][field] = value;
    setPartidos(updated);
  };

  const handleAnalizarNations = async () => {
    // Filtrar los partidos que tengan ambos campos completos
    const partidosValidos = partidos.filter(
      (p) => p.homeTeam.trim() !== "" && p.awayTeam.trim() !== ""
    );

    if (partidosValidos.length === 0) {
      setError("Por favor ingresa al menos un partido completo con equipo local y visitante.");
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
          partidos: partidosValidos.map((p) => ({
            homeTeam: p.homeTeam.trim(),
            awayTeam: p.awayTeam.trim(),
            tournament: "UEFA Nations League",
          })),
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

      {/* LISTA DINÁMICA DE PARTIDOS */}
      <div className="space-y-4">
        {partidos.map((partido, index) => (
          <div
            key={index}
            className="p-3.5 rounded-xl bg-[#06130E]/60 border border-[#278D7D]/20 space-y-2 relative"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-emerald-400/80">
                Partido {index + 1}
              </span>
              {partidos.length > 1 && (
                <button
                  onClick={() => removePartido(index)}
                  className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 p-1 rounded hover:bg-rose-950/30 transition-colors"
                  title="Eliminar partido"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-emerald-200/70 block mb-1">
                  Selección Local
                </label>
                <input
                  type="text"
                  placeholder="Ej: España"
                  value={partido.homeTeam}
                  onChange={(e) => updatePartido(index, "homeTeam", e.target.value)}
                  className="w-full bg-[#06130E] border border-[#278D7D]/30 focus:border-[#278D7D] rounded-xl px-3 py-2 text-xs text-white placeholder-emerald-900 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-emerald-200/70 block mb-1">
                  Selección Visitante
                </label>
                <input
                  type="text"
                  placeholder="Ej: Italia"
                  value={partido.awayTeam}
                  onChange={(e) => updatePartido(index, "awayTeam", e.target.value)}
                  className="w-full bg-[#06130E] border border-[#278D7D]/30 focus:border-[#278D7D] rounded-xl px-3 py-2 text-xs text-white placeholder-emerald-900 outline-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* BOTÓN PARA AÑADIR OTRO PARTIDO */}
      <button
        onClick={addPartido}
        className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[#278D7D]/40 text-emerald-300 hover:bg-[#278D7D]/10 text-xs font-bold transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        <span>Agregar otro partido</span>
      </button>

      {/* BOTÓN DE ACCIÓN PRINCIPAL */}
      <button
        onClick={handleAnalizarNations}
        disabled={loading}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-emerald-700 to-[#026747] hover:brightness-110 font-bold text-xs sm:text-sm text-white transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Evaluando {partidos.length} partido(s)...</span>
          </div>
        ) : (
          <>
            <Flame className="w-4 h-4 text-amber-300" />
            <span>
              Analizar {partidos.length} Partido{partidos.length > 1 ? "s" : ""} de Selecciones
            </span>
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
      {resultado && (
        <div className="space-y-4 pt-4 border-t border-[#278D7D]/20">
          {resultado.cupon_analisis?.map((item: any, idx: number) => (
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

          {/* COMBINADA SUGERIDA */}
          {resultado.combinada_sugerida && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 to-[#0D1F19] border border-amber-500/30 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                  🔥 Combinada Sugerida
                </span>
                <span className="text-xs font-extrabold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/30">
                  Cuota Est.: @{resultado.combinada_sugerida.cuota_total_estimada}
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 leading-relaxed">
                {resultado.combinada_sugerida.justificacion_global}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}