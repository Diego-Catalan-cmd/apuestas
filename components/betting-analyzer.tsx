"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Search,
  Dices,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  Flame,
} from "lucide-react";
import { toPng } from "html-to-image";
import { CuponAnalisisResponse } from "@/lib/types";

interface ExternalMatch {
  homeTeam: string;
  awayTeam: string;
  mercadoSugerido?: string;
  cuota?: string | number;
  probabilidad?: number;
  isHighValue?: boolean;
}

interface PartidoInput {
  local: string;
  visitante: string;
  mercadoSugerido?: string;
  cuota?: string | number;
  isHighValue?: boolean;
}

interface BettingAnalyzerProps {
  externalMatchToAdd?: ExternalMatch | null;
}

export default function BettingAnalyzer({ externalMatchToAdd }: BettingAnalyzerProps = {}) {
  const [partidos, setPartidos] = useState<PartidoInput[]>([
    { local: "", visitante: "" },
    { local: "", visitante: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<CuponAnalisisResponse | any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [descargando, setDescargando] = useState(false);

  const cuponRef = useRef<HTMLDivElement>(null);

  // Integración: agregar partido dinámico desde tarjetas de Alto Valor
  useEffect(() => {
    if (externalMatchToAdd?.homeTeam && externalMatchToAdd?.awayTeam) {
      const home = externalMatchToAdd.homeTeam.trim();
      const away = externalMatchToAdd.awayTeam.trim();

      setPartidos((prev) => {
        const existe = prev.some(
          (p) =>
            p.local.toLowerCase() === home.toLowerCase() &&
            p.visitante.toLowerCase() === away.toLowerCase()
        );
        if (existe) return prev;

        const nuevoPartido: PartidoInput = {
          local: home,
          visitante: away,
          mercadoSugerido: externalMatchToAdd.mercadoSugerido,
          cuota: externalMatchToAdd.cuota,
          isHighValue: externalMatchToAdd.isHighValue ?? true,
        };

        const emptyIndex = prev.findIndex(
          (p) => p.local.trim() === "" && p.visitante.trim() === ""
        );

        if (emptyIndex !== -1) {
          const updated = [...prev];
          updated[emptyIndex] = nuevoPartido;
          return updated;
        } else if (prev.length < 6) {
          return [...prev, nuevoPartido];
        }

        return prev;
      });
    }
  }, [externalMatchToAdd]);

  const addPartido = () => {
    if (partidos.length < 6) {
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
    // Si edita manualmente, se remueve el flag estricto de alto valor preconfigurado
    updated[index].isHighValue = false;
    setPartidos(updated);
  };

  const handleAnalizar = async () => {
    const partidosValidos = partidos.filter(
      (p) => p.local.trim() !== "" && p.visitante.trim() !== ""
    );

    if (partidosValidos.length === 0) {
      setError("Por favor, ingresa al menos un partido completo (Local y Visitante).");
      return;
    }

    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const listaPartidos = partidosValidos.map((p) => ({
        homeTeam: p.local.trim(),
        awayTeam: p.visitante.trim(),
        partido: `${p.local.trim()} vs ${p.visitante.trim()}`,
        mercadoSugerido: p.mercadoSugerido,
        cuota: p.cuota,
        isHighValue: p.isHighValue,
      }));

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partidos: listaPartidos }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        setResultado(data.data);
      } else {
        setError(data.error || "Ocurrió un error al generar el análisis.");
      }
    } catch (err: any) {
      setError("Error de conexión con el servidor: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const descargarImagen = async () => {
    if (!cuponRef.current) return;
    setDescargando(true);

    try {
      const dataUrl = await toPng(cuponRef.current, {
        cacheBust: true,
        quality: 0.95,
        pixelRatio: 2,
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], "cupon-apuestas-ia.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Cupón de Apuestas IA",
          files: [file],
        });
      } else {
        const link = document.createElement("a");
        link.download = `cupon-apuestas-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Error al generar la imagen:", err);
      alert("No se pudo generar la imagen.");
    } finally {
      setDescargando(false);
    }
  };

  const copiarCupon = () => {
    if (!resultado) return;

    let texto = `⚽ *CUPÓN DE APUESTAS IA*\n\n`;
    const cupones = resultado.cupon_analisis || [];

    cupones.forEach((item: any) => {
      texto += `⚔️ *${item.partido}*\n`;

      const lista =
        Array.isArray(item.pronosticos) && item.pronosticos.length > 0
          ? item.pronosticos
          : [
              {
                pronostico_sugerido: item.pronostico_sugerido,
                probabilidad_estimada: item.probabilidad_estimada,
              },
            ];

      lista.forEach((p: any, idx: number) => {
        texto += `  🎯 Selección ${idx + 1}: ${p.pronostico_sugerido || "N/A"}${
          p.probabilidad_estimada ? ` (${p.probabilidad_estimada}% Prob)` : ""
        }\n`;
      });
      texto += `\n`;
    });

    if (resultado.combinada_sugerida) {
      texto += `🔥 *COMBINADA SUGERIDA*\n📈 Cuota Total: ${resultado.combinada_sugerida.cuota_total_estimada}\n📝 Justificación: ${resultado.combinada_sugerida.justificacion_global}\n`;
    }

    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="w-full flex flex-col items-center justify-start text-white font-sans">
      {/* CONTENEDOR PRINCIPAL */}
      <div className="w-full max-w-lg space-y-5 sm:space-y-6 mx-auto">
        {/* ENCABEZADO */}
        <div className="text-center space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#026747]/20 border border-[#278D7D]/30 backdrop-blur-md text-[11px] sm:text-xs font-semibold text-[#278D7D]">
            <Sparkles className="w-3.5 h-3.5 text-[#278D7D] animate-pulse" />
            <span>IA Predictiva v2.0 • Engine Cuantitativo</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-emerald-100 to-[#278D7D]">
            Analizador de Apuestas IA
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/60 font-normal leading-relaxed px-2">
            Predicciones cuantitativas con Bet Builder dinámico <br className="hidden sm:inline" />
            <span className="text-emerald-200/80 font-medium">(1 a 4 selecciones por partido)</span>
          </p>
        </div>

        {/* TARJETA PRINCIPAL */}
        <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-7 bg-[#0D1F19]/70 backdrop-blur-2xl border border-[#278D7D]/30 shadow-[0_16px_40px_rgba(0,0,0,0.6)] transition-all">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#278D7D]/50 to-transparent rounded-t-2xl sm:rounded-t-3xl" />

          {/* CABECERA CUPÓN */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 border-b border-[#278D7D]/20">
            <div className="flex items-center gap-2">
              <Dices className="w-4 h-4 sm:w-5 sm:h-5 text-[#278D7D] shrink-0" />
              <h2 className="text-sm sm:text-base font-semibold text-white tracking-wide">
                Cupón de Partidos <span className="text-[#278D7D]">({partidos.length})</span>
              </h2>
            </div>

            <button
              onClick={addPartido}
              disabled={partidos.length >= 6}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#026747]/30 hover:bg-[#026747]/50 active:scale-95 border border-[#278D7D]/40 text-[#278D7D] text-xs font-semibold backdrop-blur-md transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Partido</span>
            </button>
          </div>

          {/* LISTA DE INPUTS DE PARTIDOS */}
          <div className="space-y-3 mb-5 sm:mb-7">
            {partidos.map((partido, index) => (
              <div
                key={index}
                className="group relative rounded-xl sm:rounded-2xl bg-[#06130E]/60 hover:bg-[#06130E]/90 border border-[#278D7D]/20 backdrop-blur-md p-3 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-[11px] font-bold text-emerald-200/50 px-2 py-0.5 rounded bg-white/5">
                      #{index + 1}
                    </span>
                    {partido.isHighValue && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-semibold">
                        <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                        Alto Valor {partido.cuota ? `@${partido.cuota}` : ""}
                      </span>
                    )}
                  </div>

                  {partidos.length > 1 && (
                    <button
                      onClick={() => removePartido(index)}
                      className="p-1 text-emerald-200/50 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 w-full">
                  <input
                    type="text"
                    placeholder="Local (ej: Celtic)"
                    value={partido.local}
                    onChange={(e) => updatePartido(index, "local", e.target.value)}
                    className="w-full min-w-0 bg-[#06130E] border border-[#278D7D]/30 focus:border-[#278D7D] focus:ring-2 focus:ring-[#278D7D]/20 rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-white placeholder-emerald-100/30 outline-none transition-all"
                  />

                  <span className="shrink-0 px-2 py-1 rounded-lg bg-[#005950]/60 border border-[#278D7D]/40 text-[9px] sm:text-[10px] font-black text-[#278D7D] tracking-wider">
                    VS
                  </span>

                  <input
                    type="text"
                    placeholder="Visitante (ej: Real)"
                    value={partido.visitante}
                    onChange={(e) => updatePartido(index, "visitante", e.target.value)}
                    className="w-full min-w-0 bg-[#06130E] border border-[#278D7D]/30 focus:border-[#278D7D] focus:ring-2 focus:ring-[#278D7D]/20 rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-white placeholder-emerald-100/30 outline-none transition-all"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* BOTÓN DE ACCIÓN */}
          <button
            onClick={handleAnalizar}
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-xl sm:rounded-2xl p-0.5 font-semibold text-white transition-all duration-300 active:scale-[0.98] shadow-[0_8px_25px_rgba(2,103,71,0.4)]"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[#026747] via-[#005950] to-[#278D7D] rounded-xl sm:rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity" />

            <span className="relative flex items-center justify-center gap-2 w-full py-3 sm:py-3.5 px-4 rounded-[10px] sm:rounded-[14px] bg-gradient-to-r from-[#026747] via-[#005950] to-[#278D7D] hover:from-[#278D7D] hover:to-[#026747] transition-all backdrop-blur-md">
              {loading ? (
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Procesando Datos e IA...</span>
                </div>
              ) : (
                <>
                  <Search className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                  <span className="tracking-wide text-xs sm:text-sm font-bold">Analizar Combinada</span>
                  <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </span>
          </button>
        </div>

        {/* MUESTRA DE ERROR */}
        {error && (
          <div className="flex items-center gap-2.5 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 backdrop-blur-xl text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* RESULTADOS ANALIZADOS */}
        {resultado && (
          <div
            ref={cuponRef}
            className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-[#0B1B15] border border-[#278D7D]/40 shadow-[0_16px_40px_rgba(0,0,0,0.6)] space-y-4 sm:space-y-6 overflow-hidden"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#278D7D]/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-white">Análisis Generado</h3>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={descargarImagen}
                  disabled={descargando}
                  className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-[#026747]/30 hover:bg-[#026747]/50 border border-[#278D7D]/30 text-[11px] sm:text-xs text-[#278D7D] transition-all active:scale-95 disabled:opacity-50"
                  title="Guardar o compartir como imagen"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{descargando ? "Generando..." : "Imagen"}</span>
                </button>

                <button
                  onClick={copiarCupon}
                  className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[11px] sm:text-xs text-[#278D7D] transition-all active:scale-95"
                >
                  {copiado ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Texto</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* MOSTRAR TODAS LAS SELECCIONES POR PARTIDO (BET BUILDER 1 A 4 SELECCIONES) */}
            <div className="space-y-4">
              {resultado.cupon_analisis?.map((item: any, idx: number) => {
                const listaPronosticos =
                  Array.isArray(item.pronosticos) && item.pronosticos.length > 0
                    ? item.pronosticos
                    : [
                        {
                          pronostico_sugerido:
                            item.pronostico_sugerido || "Pronóstico no disponible",
                          probabilidad_estimada: item.probabilidad_estimada,
                          justificacion: item.analisis_contextual,
                        },
                      ];

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl sm:rounded-2xl bg-[#06130E]/80 border border-[#278D7D]/20 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#278D7D]/10 pb-2 gap-2">
                      <span className="text-xs sm:text-sm font-bold text-[#278D7D] truncate">
                        {item.partido}
                      </span>
                      <span className="text-[10px] bg-[#026747]/40 border border-[#278D7D]/30 text-emerald-300 px-2 py-0.5 rounded-full font-mono shrink-0">
                        {listaPronosticos.length} opción(es)
                      </span>
                    </div>

                    <div className="space-y-2">
                      {listaPronosticos.map((p: any, pIdx: number) => (
                        <div
                          key={pIdx}
                          className="p-2.5 rounded-lg bg-[#005950]/20 border border-[#278D7D]/20 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs sm:text-sm font-semibold text-white">
                              🎯 Pronóstico:{" "}
                              <span className="text-emerald-200">{p.pronostico_sugerido}</span>
                            </div>
                            {p.probabilidad_estimada && (
                              <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                                {p.probabilidad_estimada}% Prob.
                              </span>
                            )}
                          </div>

                          {(p.justificacion || p.analisis_contextual) && (
                            <p className="text-[11px] sm:text-xs text-emerald-100/60 leading-relaxed pt-1">
                              {p.justificacion || p.analisis_contextual}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* COMBINADA SUGERIDA */}
            {resultado.combinada_sugerida && (
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#005950]/30 border border-[#278D7D]/30 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] sm:text-xs font-bold text-[#278D7D] uppercase tracking-wider">
                    Combinada Recomendada
                  </span>
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#026747]/40 border border-[#278D7D]/40 text-emerald-200 text-xs font-black">
                    @{resultado.combinada_sugerida.cuota_total_estimada}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-emerald-100/80 leading-relaxed">
                  {resultado.combinada_sugerida.justificacion_global}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}