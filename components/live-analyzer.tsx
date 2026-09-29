"use client";

import { useState } from "react";

export function LiveAnalyzer() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/analyze-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partidos: [
            { homeTeam: "España", awayTeam: "Croacia" }
          ],
        }),
      });

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || "Error al analizar");
      }
      setResult(resData.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <h2 className="text-xl font-bold mb-4">Analizador en Vivo</h2>
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Analizando..." : "Ejecutar Análisis"}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {result && (
        <pre className="mt-4 p-2 bg-gray-100 rounded text-xs overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default LiveAnalyzer;