"use client";

import { FormEvent, useState } from "react";
import { BatchBettingAnalysis, MatchPrediction } from "@/lib/types";

interface MatchRow {
  id: number;
  local: string;
  visitante: string;
}

interface BettingTicketProps {
  analysis: MatchPrediction;
}

interface ApiResult {
  success?: boolean;
  data?: BatchBettingAnalysis;
  error?: string;
}

const MAX_MATCHES = 6;

function getProbability(prediction: MatchPrediction): number | null {
  const probability = prediction.markets.find((market) => typeof market.probability === "number")?.probability;
  return probability ?? null;
}

function formatProbability(probability: number | null): string {
  return probability === null ? "No disponible" : `${Math.round(probability > 1 ? probability : probability * 100)}%`;
}

export function BettingTicket({ analysis }: BettingTicketProps) {
  const riskColors: Record<string, string> = {
    Alto: "bg-red-100 border-red-400 text-red-800",
    Medio: "bg-yellow-100 border-yellow-400 text-yellow-800",
    Bajo: "bg-green-100 border-green-400 text-green-800",
  };
  const probability = getProbability(analysis);

  return (
    <article className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-300">
      <div className="border-b-2 border-dashed border-gray-300 pb-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-800">🎫 Análisis del partido</h2>
        <div className="text-sm text-gray-600 mt-2">
          <p className="font-semibold">{analysis.matchInfo.teamA} vs {analysis.matchInfo.teamB}</p>
          <p className="text-xs">{analysis.matchInfo.league} • {analysis.matchInfo.date} {analysis.matchInfo.time}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{analysis.analysisConfirmed ? "✅" : "⚠️"}</span>
          <h3 className="font-semibold text-gray-700">Contexto del análisis</h3>
        </div>
        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{analysis.summary}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-indigo-50 border border-indigo-200 rounded p-3">
          <p className="text-xs text-indigo-700 font-semibold uppercase">Probabilidad</p>
          <p className="text-2xl font-bold text-indigo-800">{formatProbability(probability)}</p>
        </div>
        <div className={`p-3 rounded border-2 ${riskColors[analysis.riskLevel] || riskColors.Medio}`}>
          <p className="text-xs font-semibold uppercase">Riesgo</p>
          <p className="text-lg font-bold">{analysis.riskLevel}</p>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold text-gray-700 mb-2">⚽ Mercado recomendado</h3>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
          <p className="font-medium text-gray-800">{analysis.optimalSelection}</p>
          <p className="text-sm text-gray-600 mt-1">{analysis.riskJustification}</p>
        </div>
      </div>

      {analysis.markets.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-700 mb-2">Mercados evaluados</h3>
          <div className="space-y-2">
            {analysis.markets.map((market, index) => (
              <div key={`${market.market}-${index}`} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                <div>
                  <p className="font-medium text-gray-800">{market.market}</p>
                  <p className="text-gray-600">{market.selection}</p>
                </div>
                <div className="text-right text-blue-700">
                  {typeof market.probability === "number" && <p className="font-bold">{formatProbability(market.probability)}</p>}
                  {typeof market.odds === "number" && <p className="text-xs">Cuota {market.odds}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded">
        <h3 className="font-semibold text-gray-700 mb-2">📊 Justificación</h3>
        <p className="text-sm text-gray-700 leading-relaxed">{analysis.reasoning}</p>
      </div>
    </article>
  );
}

export function MatchSearcher() {
  const [matches, setMatches] = useState<MatchRow[]>([{ id: 1, local: "", visitante: "" }]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<BatchBettingAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateMatch = (id: number, field: "local" | "visitante", value: string) => {
    setMatches((current) => current.map((match) => match.id === id ? { ...match, [field]: value } : match));
  };

  const addMatch = () => {
    if (matches.length < MAX_MATCHES) {
      setMatches((current) => [...current, { id: Date.now(), local: "", visitante: "" }]);
    }
  };

  const removeMatch = (id: number) => {
    if (matches.length > 1) {
      setMatches((current) => current.filter((match) => match.id !== id));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partidos: matches.map(({ local, visitante }) => ({ teamA: local.trim(), teamB: visitante.trim() })),
        }),
      });
      const data = await response.json() as ApiResult;
      if (!response.ok || !data.success || !data.data) {
        setError(data.error || "Error en la solicitud");
        return;
      }
      setAnalysis(data.data);
    } catch (requestError) {
      console.error(requestError);
      setError("Error conectando con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = matches.every((match) => match.local.trim() && match.visitante.trim());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">⚽ Analizador de Apuestas</h1>
          <p className="text-gray-300">Analiza hasta seis partidos en un único cupón estadístico</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-2xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Cupón de partidos</h2>
              <p className="text-sm text-gray-500">{matches.length}/{MAX_MATCHES} partidos</p>
            </div>
            <button type="button" onClick={addMatch} disabled={matches.length >= MAX_MATCHES} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-lg transition">
              ＋ Añadir Partido
            </button>
          </div>

          <div className="space-y-3">
            {matches.map((match, index) => (
              <div key={match.id} className="grid grid-cols-[auto_1fr_1fr_auto] gap-3 items-end bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <span className="pb-2 font-bold text-slate-500">#{index + 1}</span>
                <label className="text-sm font-semibold text-gray-700">
                  Local
                  <input required value={match.local} onChange={(event) => updateMatch(match.id, "local", event.target.value)} placeholder="Ej: Roma" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </label>
                <label className="text-sm font-semibold text-gray-700">
                  Visitante
                  <input required value={match.visitante} onChange={(event) => updateMatch(match.id, "visitante", event.target.value)} placeholder="Ej: Lecce" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </label>
                <button type="button" onClick={() => removeMatch(match.id)} disabled={matches.length === 1} aria-label={`Eliminar partido ${index + 1}`} className="mb-0.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  🗑️
                </button>
              </div>
            ))}
          </div>

          <button type="submit" disabled={loading || !canSubmit} className="w-full mt-5 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition">
            {loading ? "⏳ Analizando cupón..." : "🔍 Analizar Cupón"}
          </button>
        </form>

        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-8"><p className="font-bold">Error</p><p className="text-sm mt-1">{error}</p></div>}
        {loading && <div className="text-center text-white py-8"><div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white" /><p className="mt-4 text-slate-300 text-sm font-medium animate-pulse">Analizando estadísticas y rendimiento...</p></div>}

        {analysis && !loading && (
          <section className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">📋 Resumen global del cupón</h2>
              <p className="text-blue-50">{analysis.couponSummary || "Análisis conjunto completado para todos los partidos."}</p>
              {analysis.couponReasoning && <p className="mt-3 text-sm text-blue-100">{analysis.couponReasoning}</p>}
            </div>
            {analysis.predictions.map((prediction) => <BettingTicket key={prediction.matchInfo.matchId} analysis={prediction} />)}
          </section>
        )}

        {!analysis && !error && !loading && <div className="bg-white rounded-lg shadow-lg p-8 text-center"><p className="text-gray-600 text-lg">Añade uno o más partidos para comenzar el análisis</p><p className="text-gray-400 text-sm mt-2">Los datos se procesan en una única consulta estadística</p></div>}
      </div>
    </div>
  );
}
