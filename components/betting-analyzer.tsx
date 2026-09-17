"use client";

import { useState, FormEvent } from "react";
import { BettingAnalysis } from "@/lib/types";

interface BettingTicketProps {
  analysis: BettingAnalysis & { matchInfo?: any };
}

export function BettingTicket({ analysis }: BettingTicketProps) {
  const riskColors: Record<string, string> = {
    Alto: "bg-red-100 border-red-400 text-red-800",
    Medio: "bg-yellow-100 border-yellow-400 text-yellow-800",
    Bajo: "bg-green-100 border-green-400 text-green-800",
  };

  const riskKey = analysis.riskLevel || "Medio";
  const currentRiskColor = riskColors[riskKey] || riskColors["Medio"];

  const homeTeamName = analysis.matchInfo?.homeTeam || analysis.matchInfo?.teamA || "Local";
  const awayTeamName = analysis.matchInfo?.awayTeam || analysis.matchInfo?.teamB || "Visitante";

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-300">
      {/* Header del Ticket */}
      <div className="border-b-2 border-dashed border-gray-300 pb-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-800">🎫 TICKET DE APUESTA</h2>
        {analysis.matchInfo && (
          <div className="text-sm text-gray-600 mt-2">
            <p className="font-semibold text-base text-gray-900">
              {homeTeamName} vs {awayTeamName}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {analysis.matchInfo.league || "Competición General"} • {analysis.matchInfo.date || "Fecha pendiente"} {analysis.matchInfo.time || ""}
            </p>
          </div>
        )}
      </div>

      {/* Confirmación de Análisis */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{analysis.analysisConfirmed ? "✅" : "⚠️"}</span>
          <h3 className="font-semibold text-gray-700">Confirmación de Análisis</h3>
        </div>
        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded leading-relaxed">
          {analysis.summary || "Análisis cuantitativo procesado."}
        </p>
      </div>

      {/* Nivel de Riesgo */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-700 mb-2">Nivel de Riesgo</h3>
        <div className={`p-3 rounded border-2 ${currentRiskColor}`}>
          <p className="font-bold text-lg">{analysis.riskLevel || "MEDIO"}</p>
          {analysis.riskJustification && (
            <p className="text-sm mt-1">{analysis.riskJustification}</p>
          )}
        </div>
      </div>

      {/* Selección Óptima */}
      {analysis.optimalSelection && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-700 mb-2">⚽ Selección Óptima</h3>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r">
            <p className="text-sm font-semibold text-blue-900">{analysis.optimalSelection}</p>
          </div>
        </div>
      )}

      {/* Mercados */}
      {Array.isArray(analysis.markets) && analysis.markets.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-700 mb-2">Mercados Seleccionados</h3>
          <div className="space-y-2">
            {analysis.markets.map((market: any, idx: number) => (
              <div
                key={idx}
                className="flex justify-between items-center bg-gray-50 p-2.5 rounded border border-gray-100 text-sm"
              >
                <div>
                  <p className="font-medium text-gray-800">{market.market || market.name || "Mercado"}</p>
                  <p className="text-gray-600 text-xs">{market.selection || market.value || "Sugerencia"}</p>
                </div>
                {(market.odds || market.odd) && (
                  <span className="text-lg font-bold text-blue-600">{market.odds || market.odd}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cuota Estimada */}
      <div className="mb-4 bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-lg border-2 border-green-400">
        <p className="text-gray-600 text-sm font-medium">Cuota Estimada de Valor</p>
        <p className="text-4xl font-bold text-green-700">
          {Number(analysis.estimatedOdds ?? 1.85).toFixed(2)}
        </p>
      </div>

      {/* Razonamiento */}
      {analysis.reasoning && (
        <div className="bg-gray-50 p-4 rounded border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-2">📊 Razonamiento Detallado</h3>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {analysis.reasoning}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-dashed border-gray-300 mt-4 pt-4 text-center text-xs text-gray-500 space-y-1">
        <p>⚠️ DISCLAIMER: Este análisis es para propósitos informativos. No constituye asesoramiento financiero.</p>
        <p>Apuesta responsablemente.</p>
      </div>
    </div>
  );
}

export default function MatchSearcher() {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<(BettingAnalysis & { matchInfo?: any }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeTeam, awayTeam }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Error procesando la solicitud");
        return;
      }

      setAnalysis(data.data);
    } catch (err) {
      setError("Error al conectar con el servidor de análisis");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">⚽ Analizador de Apuestas</h1>
          <p className="text-gray-300">Análisis cuantitativo de fútbol impulsado por IA</p>
        </div>

        {/* Formulario de Búsqueda */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Equipo Local</label>
              <input
                type="text"
                placeholder="Ej: Manchester City"
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Equipo Visitante</label>
              <input
                type="text"
                placeholder="Ej: Real Madrid"
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !homeTeam.trim() || !awayTeam.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition"
          >
            {loading ? "⏳ Analizando..." : "🔍 Analizar Partido"}
          </button>
        </form>

        {/* Mensaje de Error */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-8">
            <p className="font-bold">Notificación</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center text-white py-8">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
            <p className="mt-4 text-slate-300 text-sm font-medium animate-pulse">
              Consultando estadísticas y generando predicción cuantitativa...
            </p>
          </div>
        )}

        {/* Ticket de Apuesta */}
        {analysis && !loading && <BettingTicket analysis={analysis} />}

        {/* Estado Inicial */}
        {!analysis && !error && !loading && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 text-lg font-medium">Ingresa dos equipos para comenzar</p>
            <p className="text-gray-400 text-sm mt-2">El motor cuantitativo evaluará datos en tiempo real con OpenAI</p>
          </div>
        )}
      </div>
    </div>
  );
}