"use client";

import React, { useState, useRef } from "react";
import {
  Radio,
  Plus,
  Trash2,
  Search,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  Flame,
  Activity,
  Globe,
} from "lucide-react";
import { toPng } from "html-to-image";

interface PartidoInput {
  local: string;
  visitante: string;
}

export default function LiveAnalyzer() {
  const [partidos, setPartidos] = useState<PartidoInput[]>([
    { local: "", visitante: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [descargando, setDescargando] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const addPartido = () => {
    if (partidos.length < 4) {
      setPartidos([...partidos, { local: "", visitante: "" }]);
    }
  };

  const removePartido = (index: number) => {
    if (partidos.length > 1) {
      setPartidos(partidos.filter((_, i) => i !== index));
    }
  };

  const updatePartido = (index: number, field: "local" | "visitante", value: string) => {
    const updated = [...partidos];
    updated[index][field] = value;
    setPartidos(updated);
  };

  const handleAnalyze = async () => {
    const partidosValidos = partidos.filter(
      (p) => p.local.trim() !== "" && p.visitante.trim() !== ""
    );

    if (partidosValidos.length === 0) {
      setError("Ingresa al menos un partido completo con equipo local y visitante.");
      return;
    }

    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const response = await fetch("/api/analyze-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partidos: partidosValidos.map((p) => ({
            homeTeam: p.local.trim(),
            awayTeam: p.visitante.trim(),
          })),
        }),
      });

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || "Error al analizar el partido en vivo");
      }
      setResultado(resData.data);
    } catch (err: any) {
      setError(err.message || "Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const descargarImagen = async () => {
    if (!containerRef.current) return;
    setDescargando(true);

    try {
      const dataUrl = await toPng(containerRef.current, {
        cacheBust: true,
        quality: 0.95,
        pixelRatio: 2,
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], "analisis-en-vivo-ia.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Análisis In-Play IA",
          files: [file],
        });
      } else {
        const link = document.createElement("a");
        link.download = `analisis-live-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      alert("No se pudo generar la imagen.");
    } finally {
      setDescargando(false);
    }
  };

  const copiarResumen = () => {
    if (!resultado) return;

    let texto = `🔴 *ANÁLISIS IN-PLAY EN VIVO*\n`;
    texto += `⚔️ *${resultado.partido || "Partido"}*\n`;
    if (resultado.minuto) texto += `⏱️ Minuto: ${resultado.minuto}' | Marcador: ${resultado.marcadorActual || "N/A"}\n`;
    if (resultado.pronosticoPrincipal) {
      texto += `🎯 *Pronóstico In-Play:* ${resultado.pronosticoPrincipal.seleccion}\n`;
      texto += `📈 Cuota Est.: @${resultado.pronosticoPrincipal.cuotaEstimada || "1.80"} (${resultado.pronosticoPrincipal.probabilidadEstimada}% Prob.)\n`;
    }
    if (resultado.analisisMomentum) {
      texto += `\n🔥 *Momentum:* ${resultado.analisisMomentum}\n`;
    }

    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="w-full flex flex-col items-center justify-start text-white font-sans">
      <div className="w-full max-w-lg space-y-5 sm:space-y-6 mx-auto">
        {/* ENCABEZADO */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 backdrop-blur-md text-[11px] sm:text-xs font-semibold text-rose-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span>Motor In-Play • SportAPI7 Live Engine</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-rose-100 to-rose-400">
            Analizador En Vivo
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/60 px-2">
            Proyección cuantitativa para los minutos restantes <br className="hidden sm:inline" />
            <span className="text-rose-300/80 font-medium">(Champions, Top 4 Europa, Nations League + Chile, Brasil, Argentina)</span>
          </p>
        </div>

        {/* CONTENEDOR DE ENTRADA */}
        <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-7 bg-[#0D1F19]/70 backdrop-blur-2xl border border-[#278D7D]/30 shadow-2xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#278D7D]/20">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
              <h2 className="text-sm sm:text-base font-semibold text-white">
                Partidos en Desarrollo <span className="text-rose-400">({partidos.length})</span>
              </h2>
            </div>

            <button
              onClick={addPartido}
              disabled={partidos.length >= 4}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#026747]/30 hover:bg-[#026747]/50 border border-[#278D7D]/40 text-[#278D7D] text-xs font-semibold transition-all disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar</span>
            </button>
          </div>

          {/* LISTA DE INPUTS */}
          <div className="space-y-3 mb-5">
            {partidos.map((partido, index) => (
              <div
                key={index}
                className="group relative rounded-xl bg-[#06130E]/60 border border-[#278D7D]/20 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-rose-300 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                    LIVE #{index + 1}
                  </span>

                  {partidos.length > 1 && (
                    <button
                      onClick={() => removePartido(index)}
                      className="text-emerald-200/50 hover:text-rose-400 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    placeholder="Local (ej: Colo-Colo / Flamengo / Real Madrid)"
                    value={partido.local}
                    onChange={(e) => updatePartido(index, "local", e.target.value)}
                    className="w-full bg-[#06130E] border border-[#278D7D]/30 focus:border-rose-400 rounded-xl px-3 py-2 text-xs text-white placeholder-emerald-100/30 outline-none transition-all"
                  />

                  <span className="shrink-0 px-2 py-1 rounded-lg bg-rose-950/60 border border-rose-500/30 text-[9px] font-black text-rose-400">
                    VS
                  </span>

                  <input
                    type="text"
                    placeholder="Visitante (ej: U. de Chile / Palmeiras / Barcelona)"
                    value={partido.visitante}
                    onChange={(e) => updatePartido(index, "visitante", e.target.value)}
                    className="w-full bg-[#06130E] border border-[#278D7D]/30 focus:border-rose-400 rounded-xl px-3 py-2 text-xs text-white placeholder-emerald-100/30 outline-none transition-all"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* BOTÓN DE ANÁLISIS */}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 hover:brightness-110 font-bold text-xs sm:text-sm text-white transition-all shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Consultando métricas en tiempo real...</span>
              </div>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Analizar In-Play</span>
                <ArrowRight className="w-4 h-4 opacity-70" />
              </>
            )}
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* RESULTADO IN-PLAY */}
        {resultado && (
          <div
            ref={containerRef}
            className="relative rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-[#0B1B15] border border-rose-500/30 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#278D7D]/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">Proyección In-Play Generada</h3>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={descargarImagen}
                  disabled={descargando}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-xs text-rose-300 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{descargando ? "Generando..." : "Imagen"}</span>
                </button>

                <button
                  onClick={copiarResumen}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 text-xs text-emerald-200 transition-all active:scale-95"
                >
                  {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiado ? "Copiado" : "Texto"}</span>
                </button>
              </div>
            </div>

            {/* TARJETA DEL PARTIDO EN VIVO */}
            <div className="p-4 rounded-xl bg-[#06130E]/80 border border-[#278D7D]/30 space-y-3">
              <div className="flex justify-between items-center border-b border-[#278D7D]/20 pb-2">
                <span className="font-extrabold text-sm text-white">{resultado.partido}</span>
                <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Min {resultado.minuto || "In-Play"}' | {resultado.marcadorActual || "0-0"}
                </span>
              </div>

              {resultado.pronosticoPrincipal && (
                <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-rose-300">
                    <span>🎯 Sugerencia Tramo Final: {resultado.pronosticoPrincipal.seleccion}</span>
                    <span className="bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40 text-rose-200">
                      @{resultado.pronosticoPrincipal.cuotaEstimada || 1.80} ({resultado.pronosticoPrincipal.probabilidadEstimada}% Prob)
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-100/70">
                    Mercado enfocado en: <strong className="text-white">{resultado.pronosticoPrincipal.mercado}</strong>
                  </p>
                </div>
              )}

              {resultado.analisisMomentum && (
                <div className="p-3 rounded-lg bg-[#0D1F19] border border-[#278D7D]/20 space-y-1">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> Análisis de Momentum y Presión
                  </span>
                  <p className="text-xs text-emerald-100/80 leading-relaxed">{resultado.analisisMomentum}</p>
                </div>
              )}

              {resultado.recomendacionStake && (
                <div className="text-[11px] font-semibold text-emerald-300/80 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                  💡 Gestión de Stake: {resultado.recomendacionStake}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}