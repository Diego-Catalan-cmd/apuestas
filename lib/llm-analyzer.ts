import { MatchData, BettingAnalysis } from "./types";

/**
 * Construye el Prompt Maestro con los datos del partido
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
Eres un Analista Cuantitativo y Experto en Apuestas Deportivas. Tu objetivo es diseñar una apuesta para un "Partido Único" buscando cuotas de alto valor (entre 2.00 y 5.00). 

DATOS DEL PARTIDO:
=================
Liga: ${matchData.league}
Partido: ${matchData.teamA} vs ${matchData.teamB}
Fecha: ${matchData.date}
Hora: ${matchData.time}

CUOTAS ACTUALES:
================
- Victoria Local (${matchData.teamA}): ${matchData.odds?.home ?? "N/A"}
- Empate: ${matchData.odds?.draw ?? "N/A"}
- Victoria Visitante (${matchData.teamB}): ${matchData.odds?.away ?? "N/A"}
- Más de 2.5 Goles: ${matchData.odds?.over2_5 ?? "N/A"}
- Menos de 2.5 Goles: ${matchData.odds?.under2_5 ?? "N/A"}
- Ambos Equipos Anotan: ${matchData.odds?.bothTeamsScore ?? "N/A"}

ALINEACIONES CONFIRMADAS/PROBABLES:
===================================
${matchData.teamA} (${matchData.lineups?.homeTeam?.formation || "4-3-3"}):
${homePlayers || "- Sin alineación detallada"}

${matchData.teamB} (${matchData.lineups?.awayTeam?.formation || "4-3-3"}):
${awayPlayers || "- Sin alineación detallada"}

BAJAS/LESIONES:
===============
${matchData.teamA}:
${homeInjuries || "- Sin bajas reportadas"}

${matchData.teamB}:
${awayInjuries || "- Sin bajas reportadas"}

FASE 1: AUDITORÍA DE INFORMACIÓN Y CONTEXTO
1. Resume la información clave real. No inventes escenarios.
2. Identifica si faltan jugadores clave. Ajusta el pronóstico.
3. Evalúa la motivación de ambos equipos.

FASE 2: CONSTRUCCIÓN DE LA APUESTA (Cuota 2.00 a 5.00)
Utiliza EXCLUSIVAMENTE los siguientes mercados permitidos:
* Mercados Permitidos: Goles ("Más de X goles"), Ambos Equipos Anotan (Sí), Córners, Doble Oportunidad, Tiros de equipo.
* Prohibiciones: Estadísticas individuales de jugadores, Hándicap Asiático, "Menos de X Goles".

FASE 3: OUTPUT REQUERIDO (JSON)
Responde strictly con esta estructura JSON:
{
  "analysisConfirmed": boolean,
  "summary": "Breve resumen clave",
  "riskLevel": "Alto | Medio | Bajo",
  "riskJustification": "Justificación de riesgo",
  "optimalSelection": "Pronóstico estructurado",
  "markets": [
    {
      "market": "Nombre del mercado",
      "selection": "Selección",
      "odds": 2.10
    }
  ],
  "estimatedOdds": 2.50,
  "reasoning": "Explicación detallada"
}`;
}

/**
 * Análisis con Gemini (Modelo activo gemini-3.6-flash)
 */
export async function analyzeWithGemini(matchData: MatchData): Promise<BettingAnalysis> {
  const prompt = buildMasterPrompt(matchData);
  const model = (process.env.GEMINI_MODEL || "gemini-3.6-flash").replace(/^models\//, "");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
            responseMimeType: "application/json",
          },
        }),
      }
    );

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
    console.error("Error en Gemini:", error);
    throw new Error(`Error procesando análisis con Gemini: ${error.message}`);
  }
}

/**
 * Opción Gratuita con Groq (Llama 3.3 70B)
 */
export async function analyzeWithGroq(matchData: MatchData): Promise<BettingAnalysis> {
  const prompt = buildMasterPrompt(matchData);

  try {
    const response = await fetch("[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Eres un experto en análisis cuantitativo de apuestas deportivas. Responde siempre en JSON válido.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
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
    console.error("Error en Groq:", error);
    throw new Error(`Error procesando análisis con Groq: ${error.message}`);
  }
}

function parseAnalysisOutput(analysis: any): BettingAnalysis {
  return {
    analysisConfirmed: Boolean(analysis.analysisConfirmed),
    summary: analysis.summary || "",
    riskLevel: analysis.riskLevel || "Medio",
    riskJustification: analysis.riskJustification || "",
    optimalSelection: analysis.optimalSelection || "",
    markets: analysis.markets || [],
    estimatedOdds: Math.max(2.0, Math.min(5.0, analysis.estimatedOdds || 2.5)),
    reasoning: analysis.reasoning || "",
  };
}

/**
 * Selector automático de IA con Respaldo
 */
export async function analyzeMatch(matchData: MatchData): Promise<BettingAnalysis> {
  let geminiError: any = null;

  // 1. Primer intento: Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      return await analyzeWithGemini(matchData);
    } catch (error: any) {
      geminiError = error;
      console.warn("Gemini falló o está saturado. Reintentando con Groq...", error.message);
    }
  }

  // 2. Respaldo secundario: Groq (Llama 3.3 70B)
  if (process.env.GROQ_API_KEY) {
    try {
      return await analyzeWithGroq(matchData);
    } catch (groqError: any) {
      console.error("Groq también falló:", groqError.message);
      throw new Error(`Fallo general en IA. Gemini: ${geminiError?.message || "N/A"} | Groq: ${groqError.message}`);
    }
  }

  throw new Error("No hay API Keys válidas configuradas en el entorno (GEMINI_API_KEY / GROQ_API_KEY)");
}