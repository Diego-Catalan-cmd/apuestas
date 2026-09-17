import OpenAI from "openai";
import { MatchData, BettingAnalysis } from "./types";

// Inicialización de cliente OpenAI (prioritario)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

/**
 * Construye el Prompt Maestro con los datos actualizados (homeTeam / awayTeam)
 * y elimina restricciones arbitrarias de cuotas para permitir análisis cuantitativo libre.
 */
function buildMasterPrompt(matchData: MatchData): string {
  const homeInjuries = (matchData.injuries?.homeTeam || [])
    .map((i) => `- ${i.player} (${i.type})`)
    .join("\n");
  const awayInjuries = (matchData.injuries?.awayTeam || [])
    .map((i) => `- ${i.player} (${i.type})`)
    .join("\n");

  const homePlayers = (matchData.lineups?.homeTeam?.players || [])
    .slice(0, 11)
    .map((p) => `- ${p.name} (${p.position})`)
    .join("\n");

  const awayPlayers = (matchData.lineups?.awayTeam?.players || [])
    .slice(0, 11)
    .map((p) => `- ${p.name} (${p.position})`)
    .join("\n");

  return `Tu Rol y Entrada de Datos:
Eres un Analista Cuantitativo y Experto en Apuestas Deportivas. Tu objetivo es encontrar el máximo valor matemático en el encuentro basándote estrictamente en los datos estadísticos históricos y el contexto actual.

DATOS DEL PARTIDO:
=================
Liga: ${matchData.league}
Partido: ${matchData.homeTeam} vs ${matchData.awayTeam}
Fecha: ${matchData.date}
Hora: ${matchData.time}

CUOTAS DISPONIBLES:
================
- Victoria Local (${matchData.homeTeam}): ${matchData.odds?.home ?? "N/A"}
- Empate: ${matchData.odds?.draw ?? "N/A"}
- Victoria Visitante (${matchData.awayTeam}): ${matchData.odds?.away ?? "N/A"}
- Más de 2.5 Goles: ${matchData.odds?.over2_5 ?? "N/A"}
- Menos de 2.5 Goles: ${matchData.odds?.under2_5 ?? "N/A"}
- Ambos Equipos Anotan: ${matchData.odds?.bothTeamsScore ?? "N/A"}

ALINEACIONES CONFIRMADAS / PROBABLES:
===================================
${matchData.homeTeam} (${matchData.lineups?.homeTeam?.formation || "4-3-3"}):
${homePlayers || "- Sin alineación detallada"}

${matchData.awayTeam} (${matchData.lineups?.awayTeam?.formation || "4-3-3"}):
${awayPlayers || "- Sin alineación detallada"}

BAJAS / LESIONES:
===============
${matchData.homeTeam}:
${homeInjuries || "- Sin bajas reportadas"}

${matchData.awayTeam}:
${awayInjuries || "- Sin bajas reportadas"}

INSTRUCCIONES DE ANÁLISIS:
1. Evalúa el mercado con mejor relación riesgo/beneficio (no te limites a ganador del partido; considera córneres, tarjetas, líneas de goles o doble oportunidad).
2. Sin topes de cuota artificiales: busca valor real según la probabilidad implícita.
3. Cero alucinaciones: justifica tu selección basándote únicamente en las alineaciones, bajas y datos suministrados.

FORMATO DE SALIDA (JSON ESTRICTO):
{
  "analysisConfirmed": true,
  "summary": "Resumen ejecutivo del análisis",
  "riskLevel": "Alto | Medio | Bajo",
  "riskJustification": "Explicación del nivel de riesgo asignado",
  "optimalSelection": "Mercado y selección principal elegida",
  "markets": [
    {
      "market": "Nombre del mercado",
      "selection": "Selección recomendada",
      "odds": 1.85
    }
  ],
  "estimatedOdds": 1.85,
  "reasoning": "Explicación cuantitativa detallada de la decisión"
}`;
}

/**
 * Convierte y valida el objeto devuelto por las IAs al tipo BettingAnalysis
 */
function parseAnalysisOutput(analysis: any): BettingAnalysis {
  return {
    analysisConfirmed: Boolean(analysis.analysisConfirmed ?? true),
    summary: analysis.summary || "Análisis completado exitosamente.",
    riskLevel: ["Alto", "Medio", "Bajo"].includes(analysis.riskLevel)
      ? analysis.riskLevel
      : "Medio",
    riskJustification: analysis.riskJustification || "",
    optimalSelection: analysis.optimalSelection || "Sin selección óptima",
    markets: Array.isArray(analysis.markets) ? analysis.markets : [],
    estimatedOdds: typeof analysis.estimatedOdds === "number" ? analysis.estimatedOdds : 1.0,
    reasoning: analysis.reasoning || "",
    global_analysis: analysis.summary || "",
    predictions: [
      {
        match: analysis.optimalSelection || "Partido Analizado",
        recommended_market: analysis.optimalSelection || "N/A",
        confidence: analysis.riskLevel === "Bajo" ? 85 : analysis.riskLevel === "Medio" ? 65 : 45,
        riskLevel: analysis.riskLevel || "Medio",
        reasoning: analysis.reasoning || "",
      },
    ],
  };
}

/**
 * 1. Motor Principal: OpenAI (GPT-4o)
 */
export async function analyzeWithOpenAI(matchData: MatchData): Promise<BettingAnalysis> {
  const prompt = buildMasterPrompt(matchData);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Eres un experto en análisis cuantitativo de apuestas deportivas. Devuelves únicamente respuestas en formato JSON válido.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI devolvió una respuesta vacía.");

  return parseAnalysisOutput(JSON.parse(content));
}

/**
 * 2. Respaldo 1: Gemini API
 */
export async function analyzeWithGemini(matchData: MatchData): Promise<BettingAnalysis> {
  const prompt = buildMasterPrompt(matchData);
  const rawModel = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const model = rawModel.replace(/^models\//, "");

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 2000,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (response.status === 503 || response.status === 429) {
        if (attempt < 3) {
          await new Promise((res) => setTimeout(res, 2000));
          continue;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error (${response.status}): ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("Respuesta vacía por parte de Gemini API");

      let cleanText = rawText.trim();
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      }

      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      const analysis = JSON.parse(jsonMatch ? jsonMatch[0] : cleanText);

      return parseAnalysisOutput(analysis);
    } catch (error: any) {
      if (attempt === 3) throw error;
    }
  }

  throw new Error("Gemini no pudo responder tras múltiples reintentos.");
}

/**
 * 3. Respaldo 2: Groq API
 */
export async function analyzeWithGroq(matchData: MatchData): Promise<BettingAnalysis> {
  const prompt = buildMasterPrompt(matchData);
  const groqModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
  let lastError: any = null;

  for (const model of groqModels) {
    try {
      const response = await fetch("[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "Eres un experto en análisis cuantitativo de apuestas deportivas. Responde siempre en JSON válido.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Groq API error (${response.status}): ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content);

      return parseAnalysisOutput(analysis);
    } catch (error: any) {
      lastError = error;
    }
  }

  throw new Error(`Error en Groq: ${lastError?.message || "Sin conexión con los modelos de Groq"}`);
}

/**
 * Selector Orquestador Principal con Fallback en Cascada:
 * 1. OpenAI (gpt-4o)
 * 2. Gemini (Respaldo)
 * 3. Groq (Respaldo final)
 */
export async function analyzeMatch(matchData: MatchData): Promise<BettingAnalysis> {
  // Intento 1: OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      return await analyzeWithOpenAI(matchData);
    } catch (error: any) {
      console.warn("[IA Fallback] OpenAI falló. Pasando a Gemini...", error.message);
    }
  }

  // Intento 2: Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      return await analyzeWithGemini(matchData);
    } catch (error: any) {
      console.warn("[IA Fallback] Gemini falló. Pasando a Groq...", error.message);
    }
  }

  // Intento 3: Groq
  if (process.env.GROQ_API_KEY) {
    try {
      return await analyzeWithGroq(matchData);
    } catch (error: any) {
      console.error("[IA Fallback] Groq falló.", error.message);
    }
  }

  throw new Error("No hay API Keys válidas o disponibles en las variables de entorno.");
}