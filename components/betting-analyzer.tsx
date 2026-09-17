"use client";

import { useState, FormEvent } from "react";
import { CuponAnalisisResponse, CuponItem } from "@/lib/types";

interface MatchInput {
  id: string;
  homeTeam: string;
  awayTeam: string;
}

export default function BettingAnalyzer() {
  const [matches, setMatches] = useState<MatchInput[]>([
    { id: "1", homeTeam: "", awayTeam: "" },
    { id: "2", homeTeam: "", awayTeam: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CuponAnalisisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manejadores para agregar/eliminar/actualizar partidos
  const handleAddMatch = () => {
    setMatches([
      ...matches,
      { id: Date.now().toString(), homeTeam: "", awayTeam: "" },
    ]);
  };

  const handleRemoveMatch = (id: string) => {
    if (matches.length > 1) {
      setMatches(matches.filter((m) => m.id !== id));
    }
  };

  const handleMatchChange = (
    id: string,
    field: "homeTeam" | "awayTeam",
    value: string
  ) => {
    setMatches(
      matches.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Filtrar partidos vacíos
    const validMatches = matches.filter(
      (m) => m.homeTeam.trim() !== "" && m.awayTeam.trim() !== ""
    );

    if (validMatches.length === 0) {
      setError("Por favor, ingresa al menos un partido completo.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partidos: validMatches.map((m) => ({
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            partido: `${m.homeTeam} vs ${m.awayTeam}`,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Error al procesar el cupón de partidos");
        return;
      }

      setAnalysis(data.data);
    } catch (err: any) {
      setError("Error al conectar con el servidor de análisis");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            ⚽ <span>Analizador de Apuestas</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Genera cupones y combinadas de alto valor con Inteligencia Artificial
          </p>
        </div>

        {/* Formulario de Partidos Múltiples */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-2xl p-5 shadow-xl space-y-4"
        >
          <div className="flex justify-between items-center border-b border-slate-700 pb-3">
            <h2 className="text-lg font-bold text-slate-200">
              Cupón de Partidos ({matches.length})
            </h2>
            <button
              type="button"
              onClick={handleAddMatch}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1.5 rounded-lg transition"
            >
              + Agregar Partido
            </button>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {matches.map((match, index) => (
              <div
                key={match.id}
                className="flex items-center gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-700/40"
              >
                <span className="text-xs text-slate-500 font-bold w-5">
                  #{index + 1}
                </span>

                <input
                  type="text"
                  placeholder="Local (ej: Arsenal)"
                  value={match.homeTeam}
                  onChange={(e) =>
                    handleMatchChange(match.id, "homeTeam", e.target.value)
                  }
                  className="w-full bg-slate-800 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />

                <span className="text-xs text-slate-400 font-bold">VS</span>

                <input
                  type="text"
                  placeholder="Visitante (ej: Chelsea)"
                  value={match.awayTeam}
                  onChange={(e) =>
                    handleMatchChange(match.id, "awayTeam", e.target.value)
                  }
                  className="w-full bg-slate-800 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />

                {matches.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMatch(match.id)}
                    className="text-slate-400 hover:text-red-400 p-1 rounded-lg transition"
                    title="Eliminar partido"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg transition duration-200"
          >
            {loading ? "⏳ Analizando Cupón con IA..." : "🔍 Analizar Combinada"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-950/80 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Loader */}
        {loading && (
          <div className="text-center py-10 space-y-3">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-slate-400 text-sm animate-pulse">
              Evaluando córneres, tarjetas, goles y rachas de todos los partidos...
            </p>
          </div>
        )}

        {/* BOLETO DE APUESTA ESTILO BETANO */}
        {analysis && !loading && (
          <div className="bg-[#1e293b] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden font-sans">
            {/* Header Betano */}
            <div className="bg-gradient-to-r from-[#161f2c] to-[#1e293b] p-5 border-b border-slate-700/80">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Combinada de {analysis.cupon_analisis?.length || 1}
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-1">
                    🎯 Cupón Recomendado
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-medium">Cuota Total Est.</p>
                  <p className="text-3xl font-black text-emerald-400">
                    {analysis.combinada_sugerida?.cuota_total_estimada ||
                      analysis.estimatedOdds ||
                      "2.50"}
                  </p>
                </div>
              </div>

              {analysis.combinada_sugerida?.justificacion_global && (
                <div className="mt-3 bg-slate-900/70 p-3 rounded-xl border border-slate-700/50 text-xs text-slate-300 leading-relaxed">
                  💡 <span className="font-semibold text-slate-200">Estrategia Global:</span>{" "}
                  {analysis.combinada_sugerida.justificacion_global}
                </div>
              )}
            </div>

            {/* Lista de Selecciones en el Cupón */}
            <div className="divide-y divide-slate-700/60">
              {analysis.cupon_analisis?.map((item: CuponItem, idx: number) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-800/40 hover:bg-slate-800/70 transition space-y-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                        ✓
                      </span>
                      <div>
                        <p className="text-base font-bold text-white leading-tight">
                          {item.pronostico_sugerido}
                        </p>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          {item.partido}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="inline-block bg-blue-500/10 text-blue-400 font-bold text-xs px-2 py-1 rounded-lg border border-blue-500/20">
                        {item.probabilidad_estimada || 80}% Prob.
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 leading-relaxed pl-8">
                    {item.analisis_contextual}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer Betano */}
            <div className="bg-[#131b26] p-4 text-center text-[11px] text-slate-500 border-t border-slate-700/80 space-y-1">
              <p>ID Análisis: #{Math.floor(100000000 + Math.random() * 900000000)}</p>
              <p>⚠️ Este cupón es generado por modelos cuantitativos predictivos. Apuesta de forma responsable.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}