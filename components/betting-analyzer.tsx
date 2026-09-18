"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { toPng } from "html-to-image";
import { CuponAnalisisResponse, PartidoCupon, PronosticoItem } from "@/lib/types";

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
  const [copiado, setCopiado] = useState(false);

  // Referencia al contenedor HTML que se descargará como imagen
  const ticketRef = useRef<HTMLDivElement>(null);

  // Cargar el último análisis guardado para no gastar tokens al recargar la página
  useEffect(() => {
    const saved = localStorage.getItem("ultimo_cupon_apuestas");
    if (saved) {
      try {
        setAnalysis(JSON.parse(saved));
      } catch (e) {
        console.error("Error al cargar el cupón guardado:", e);
      }
    }
  }, []);

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
      localStorage.setItem("ultimo_cupon_apuestas", JSON.stringify(data.data));
    } catch (err: any) {
      setError("Error al conectar con el servidor de análisis");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Función para capturar el ticket y guardarlo como imagen PNG
  const handleDescargarImagen = async () => {
    if (!ticketRef.current) return;

    try {
      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        pixelRatio: 2, // Alta definición para pantallas móviles y PC
      });

      const link = document.createElement("a");
      link.download = `ticket-bet-builder-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error al exportar la imagen:", err);
    }
  };

  // Función para compartir mediante menú nativo (móvil) o copiar al portapapeles (PC)
  const handleCompartirOCopiar = async () => {
    if (!analysis) return;

    let texto = `⚽ TICKET BET BUILDER ⚽\n\n`;
    analysis.cupon_analisis?.forEach((partidoItem: PartidoCupon) => {
      texto += `📌 ${partidoItem.partido}\n`;
      partidoItem.pronosticos?.forEach((item: PronosticoItem) => {
        texto += `  • ${item.pronostico_sugerido} (${item.probabilidad_estimada}% prob.)\n`;
      });
      texto += `\n`;
    });

    if (analysis.combinada_sugerida) {
      texto += `🎯 Cuota Total Est: ${analysis.combinada_sugerida.cuota_total_estimada}\n`;
      texto += `💡 ${analysis.combinada_sugerida.justificacion_global}\n`;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Ticket Bet Builder",
          text: texto,
        });
      } catch (err) {
        // Cancelado por el usuario
      }
    } else {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const handleClearTicket = () => {
    localStorage.removeItem("ultimo_cupon_apuestas");
    setAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            ⚽ <span>Analizador de Apuestas IA</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Predicciones cuantitativas con Bet Builder dinámico (1 a 4 selecciones por partido)
          </p>
        </div>

        {/* Formulario */}
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
                  placeholder="Local (ej: Celtic FC)"
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
                  placeholder="Visitante (ej: Ferencvarosi)"
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
            {loading ? "⏳ Construyendo Bet Builders..." : "🔍 Analizar Combinada"}
          </button>
        </form>

        {error && (
          <div className="bg-red-950/80 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm">
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-10 space-y-3">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-slate-400 text-sm animate-pulse">
              Evaluando estadísticas para armar mercados múltiples por partido...
            </p>
          </div>
        )}

        {/* Panel de acciones y Ticket Boleto */}
        {analysis && !loading && (
          <div className="space-y-4">
            {/* Barra de herramientas para la tarjeta */}
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                onClick={handleDescargarImagen}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition"
              >
                📸 Descargar Imagen
              </button>
              <button
                onClick={handleCompartirOCopiar}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition"
              >
                📲 {copiado ? "¡Copiado!" : "Compartir / Copiar"}
              </button>
              <button
                onClick={handleClearTicket}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-2 px-3 rounded-xl text-xs transition"
              >
                🗑️ Limpiar
              </button>
            </div>

            {/* Boleto de Apuestas vinculado al useRef */}
            <div
              ref={ticketRef}
              className="bg-[#1e293b] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden font-sans"
            >
              {/* Encabezado del Boleto */}
              <div className="bg-gradient-to-r from-[#161f2c] to-[#1e293b] p-5 border-b border-slate-700/80">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Combinada Dinámica
                    </span>
                    <h2 className="text-xl font-extrabold text-white mt-1">
                      🎯 Ticket Bet Builder
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-medium">Cuota Total Est.</p>
                    <p className="text-3xl font-black text-emerald-400">
                      {analysis.combinada_sugerida?.cuota_total_estimada || "3.50"}
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

              {/* Partidos y Selecciones Múltiples */}
              <div className="divide-y divide-slate-700/80">
                {analysis.cupon_analisis?.map((partidoItem: PartidoCupon, pIdx: number) => (
                  <div key={pIdx} className="p-4 bg-slate-800/30 space-y-3">
                    <div className="flex justify-between items-center bg-slate-900/80 px-3.5 py-2 rounded-lg border border-slate-700/60">
                      <span className="text-sm font-bold text-blue-400 flex items-center gap-2">
                        ⚽ {partidoItem.partido}
                      </span>
                      <span className="text-[11px] bg-slate-800 text-slate-400 font-medium px-2 py-0.5 rounded border border-slate-700">
                        {partidoItem.pronosticos?.length || 1} Selecciones
                      </span>
                    </div>

                    {partidoItem.analisis_contextual && (
                      <p className="text-xs text-slate-400 italic px-1">
                        {partidoItem.analisis_contextual}
                      </p>
                    )}

                    <div className="space-y-2.5 pl-2 border-l-2 border-blue-500/40">
                      {partidoItem.pronosticos?.map((item: PronosticoItem, sIdx: number) => (
                        <div
                          key={sIdx}
                          className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/40 space-y-1.5"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex-shrink-0">
                                ✓
                              </span>
                              <span className="text-sm font-bold text-white">
                                {item.pronostico_sugerido}
                              </span>
                            </div>
                            <span className="bg-emerald-500/10 text-emerald-400 font-bold text-xs px-2 py-0.5 rounded border border-emerald-500/20 flex-shrink-0">
                              {item.probabilidad_estimada}% Prob.
                            </span>
                          </div>

                          {item.justificacion && (
                            <p className="text-xs text-slate-300 leading-relaxed pl-7">
                              {item.justificacion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pie de Boleto */}
              <div className="bg-[#131b26] p-4 text-center text-[11px] text-slate-500 border-t border-slate-700/80 space-y-1">
                <p>ID Análisis: #{Math.floor(100000000 + Math.random() * 900000000)}</p>
                <p>⚠️ Este análisis es cuantitativo e informativo. Apuesta de manera responsable.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}