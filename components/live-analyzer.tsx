"use client";

import React, { useState } from "react";
import { Radio, Flame, AlertCircle, Target, Flag, CreditCard, Crosshair, ShieldAlert } from "lucide-react";

export default function LiveAnalyzer() {
  const [partido, setPartido] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalizarLive = async () => {
    if (!partido.trim()) {
      setError("Por favor ingresa el partido (ej: Fulham vs Manchester United).");
      return;
    }

    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const res = await fetch("/api/analyze-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partido }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        setResultado(data.data);
      } else {
        setError(data.error || "No se pudo obtener el análisis del partido.");
      }
    } catch (err: any) {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (categoria: string) => {
    switch (categoria?.toLowerCase()) {
      case "córneres":
      case "corneres":
        return <Flag className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case "tarjetas":
        return <CreditCard className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
      case "tiros":
        return <Crosshair className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      default:
        return <Target className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
    }
  };

  return (
    <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-7 bg-slate-900/40 backdrop-blur-2xl border border-rose-500/20 shadow-[0_16px_40px_rgba(0,0,0,0.5)] space-y-5">
      
      {/* CABECERA */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
          <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
            Analizador In-Play <span className="text-rose-400 text-xs px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30">EN VIVO</span>
          </h2>
        </div>
      </div>

      {/* INPUT */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 block">
          Partido en curso (Búsqueda Multivariable Vía RapidAPI)
        </label>
        <input
          type="text"
          placeholder="Ej: OGC Niza vs Lille OSC"
          value={partido}
          onChange={(e) => setPartido(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAnalizarLive()}
          className="w-full bg-slate-950/60 border border-white/10 focus:border-rose-500/60 focus:ring-2 focus:ring-rose-500/20 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all"
        />
        <p className="text-[11px] text-slate-400">
          * Evalúa Goles, Córneres, Tarjetas, Tiros y Hándicaps en tiempo real.
        </p>
      </div>

      {/* BOTÓN */}
      <button
        onClick={handleAnalizarLive}
        disabled={loading}
        className="w-full py-3.5 px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 font-bold text-xs sm:text-sm text-white transition-all shadow-[0_4px_25px_rgba(225,29,72,0.35)] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Escaneando mercados en vivo...</span>
          </div>
        ) : (
          <>
            <Flame className="w-4 h-4 text-amber-200" />
            <span>Escanear Oportunidades Live</span>
          </>
        )}
      </button>

      {/* ERROR */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* RESULTADO MULTIVARIABLE EN VIVO */}
      {resultado && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-rose-500/30 space-y-4 animate-in fade-in">
          
          {/* HEADER RESULTADO */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                {resultado.partido}
              </div>
              <div className="text-[11px] font-semibold text-rose-400 mt-0.5">
                Minuto {resultado.minuto}' • Marcador: {resultado.marcadorActual}
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                {resultado.pronosticoPrincipal?.probabilidadEstimada || 80}% Prob.
              </span>
              <div className="text-[10px] text-slate-400 mt-1">
                Riesgo: <span className="text-amber-400 font-bold">{resultado.nivelRiesgo}</span>
              </div>
            </div>
          </div>

          {/* PRONÓSTICO PRINCIPAL */}
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase font-extrabold tracking-wider text-rose-400 flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> Oportunidad Principal In-Play
            </div>
            <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-center justify-between gap-2">
              <div className="text-xs font-black text-white">
                {resultado.pronosticoPrincipal?.seleccion || resultado.pronosticoLive}
              </div>
              {resultado.pronosticoPrincipal?.cuotaEstimada && (
                <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 shrink-0">
                  @{resultado.pronosticoPrincipal.cuotaEstimada}
                </span>
              )}
            </div>
          </div>

          {/* MERCADOS ALTERNATIVOS (CÓRNERES, TARJETAS, TIROS) */}
          {resultado.mercadosAlternativos && resultado.mercadosAlternativos.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
                Mercados Secundarios de Valor:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {resultado.mercadosAlternativos.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white/[0.03] border border-white/10 p-2.5 rounded-xl flex items-start gap-2 text-xs">
                    {getCategoryIcon(item.categoria)}
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{item.categoria}</div>
                      <div className="text-white font-medium text-[11px]">{item.sugerencia}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ANÁLISIS DE MOMENTUM */}
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
              Análisis Táctico y Momentum:
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5">
              {resultado.analisisMomentum || resultado.fundamentoInPlay}
            </p>
          </div>

          {/* RECOMENDACIÓN DE STAKE */}
          {resultado.recomendacionStake && (
            <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
              <span><strong>Gestión de Banca:</strong> {resultado.recomendacionStake}</span>
            </div>
          )}

        </div>
      )}

    </div>
  );
}