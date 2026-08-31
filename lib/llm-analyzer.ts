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

REGLA DE ORO (BÚSQUEDA WEB Y TIEMPO): 
1. Ya contamos con información actualizada del partido
2. El análisis debe enfocarse en mercados de alto valor (2.00-5.00)

FASE 1: LA AUDITORÍA DE INFORMACIÓN PREVIA (Alineaciones y Contexto)
1. Confirmación de Datos: Resume la información clave real (bajas confirmadas, estado de forma, contexto). No inventes escenarios.
2. Filtro de la Columna Vertebral: Identifica si a alguno de los equipos le falta su portero titular, central líder o máximo goleador. Si el favorito tiene bajas críticas, ajusta el pronóstico en su contra.
3. El Filtro de la Trampa del Mercado: Ya que buscamos cuotas altas (2.00 - 5.00), desconfía del valor exagerado. Si un gigante paga inexplicablemente alto, asume que hay un factor oculto. Evita apostar a su victoria directa.
4. Ajuste por Motivación (El Termómetro de Riesgo): Evalúa qué se juegan. Si no hay nada importante en disputa, BAJA EL RIESGO automáticamente. Refugia el pronóstico en mercados de inercia (córners, tiros de equipo o goles).

FASE 2: CONSTRUCCIÓN DE LA APUESTA (Cuota 2.00 a 5.00)
Utiliza EXCLUSIVAMENTE los siguientes mercados para construir un Bet Builder o apuesta simple:
* Mercados Permitidos: Goles (Solo "Más de X goles"), Ambos Equipos Anotan (Sí), Córners (Totales o por equipo), Doble Oportunidad (1X, X2, 12), Tiros (Totales del partido o del equipo).
* Prohibiciones Absolutas: Cero estadísticas de jugadores individuales. Cero Hándicap Asiático. Cero mercados de "Menos de X Goles".
* Coherencia Matemática Estricta: NUNCA combines mercados que se contradigan o limiten tus propias probabilidades (Ej. NUNCA combines "Doble Oportunidad (1X)" con "Ambos Equipos Anotan: NO").

FASE 3: TU OUTPUT REQUERIDO
Responde estrictamente con esta estructura JSON:
{
  "analysisConfirmed": boolean,
  "summary": "Breve resumen de la información clave REAL extraída",
  "riskLevel": "Alto | Medio | Bajo",
  "riskJustification": "Justificación por lo que se juegan",
  "optimalSelection": "Tu pronóstico estructurado usando solo mercados permitidos",
  "markets": [
    {
      "market": "Nombre del mercado",
      "selection": "Tu selección",
      "odds": número
    }
  ],
  "estimatedOdds": número entre 2.00 y 5.00,
  "reasoning": "Explicación detallada de tu análisis"
}`;
}

/**
 * Llama a la API de OpenAI con el Prompt Maestro
 */
export async function analyzeWithOpenAI(matchData: MatchData): Promise<BettingAnalysis> {
  const prompt = buildMasterPrompt(matchData);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: "Eres un experto en análisis cuantitativo de apuestas deportivas. Siempre responde en JSON válido.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    const analysis = JSON.parse(analysisText) as BettingAnalysis;

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
  } catch (error: any) {
    console.error("Error in OpenAI analysis:", error);
    throw new Error(`Failed to analyze match with OpenAI: ${error.message}`);
  }
}

/**
 * Llama a la API de Gemini
 */
export async function analyzeWithGemini(matchData: MatchData): Promise<BettingAnalysis> {
  const prompt = buildMasterPrompt(matchData);
  
  // Usar únicamente modelos activos soportados en v1beta
  const rawModel = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const preferredModel = rawModel.replace(/^models\//, "");
  
  const modelsToTry = Array.from(new Set([
    preferredModel,
    "gemini-3.6-flash",
    "gemini-2.5-flash"
  ]));

  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2000,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        // Si hay saturación (503) o límite de tasa (429), esperar 1.5s y reintentar
        if (response.status === 503 || response.status === 429) {
          console.warn(`[Gemini ${response.status}] Modelo ${model} ocupado. Reintento ${attempt}/2...`);
          await new Promise((res) => setTimeout(res, 1500));
          continue;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Gemini API error (${response.status}): ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
          throw new Error("Respuesta vacía por parte de Gemini API");
        }

        // Limpiar formato Markdown
        let cleanText = rawText.trim();
        if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        }

        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        const analysis = JSON.parse(jsonMatch ? jsonMatch[0] : cleanText) as BettingAnalysis;

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
      } catch (error: any) {
        lastError = error;
      }
    }
  }

  throw new Error(`Error procesando análisis con Gemini: ${lastError?.message || "No se pudo conectar con los servidores"}`);
}

/**
 * Selecciona automáticamente entre OpenAI o Gemini según disponibilidad
 */
export async function analyzeMatch(matchData: MatchData): Promise<BettingAnalysis> {
  if (process.env.OPENAI_API_KEY) {
    return analyzeWithOpenAI(matchData);
  } else if (process.env.GEMINI_API_KEY) {
    return analyzeWithGemini(matchData);
  } else {
    throw new Error("No hay clave de API configurada para ningún LLM (OPENAI_API_KEY / GEMINI_API_KEY)");
  }
}