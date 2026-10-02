import { NextResponse } from "next/server";
import { getLiveMatchesFromSportAPI } from "@/lib/api-football";
import { OpenAI } from "openai";

export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let searchString = "";
    let minutoUsuario = body.minuto || null;
    let marcadorUsuario = body.marcador || null;

    if (typeof body.partido === "string" && body.partido.trim() !== "") {
      searchString = body.partido.trim();
    } else if (Array.isArray(body.partidos) && body.partidos.length > 0) {
      const p = body.partidos[0];
      searchString = `${p.homeTeam || p.local || ""} vs ${p.awayTeam || p.visitante || ""}`.trim();
      if (p.minuto) minutoUsuario = p.minuto;
      if (p.marcador) marcadorUsuario = p.marcador;
    } else if (body.homeTeam && body.awayTeam) {
      searchString = `${body.homeTeam} vs ${body.awayTeam}`;
    }

    if (!searchString || searchString === "vs") {
      return NextResponse.json(
        { success: false, error: "Por favor, ingresa los nombres de los equipos para el análisis en vivo." },
        { status: 400 }
      );
    }

    // 1. INTENTAR OBTENER DATOS EN REAL-TIME DESDE SPORTAPI7
    const liveEvents = await getLiveMatchesFromSportAPI();
    let matchContext = null;

    if (liveEvents.length > 0) {
      const liveListSummary = liveEvents.map((e: any) => ({
        id: e.id,
        partido: `${e.homeTeam?.name} vs ${e.awayTeam?.name}`,
        torneo: e.tournament?.name || "Desconocido",
        minuto: e.status?.description || e.time?.currentPeriodStart || "En juego",
        marcador: `${e.homeScore?.current ?? 0} - ${e.awayScore?.current ?? 0}`,
      }));

      try {
        const matchFinderRes = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Identifica qué evento de la lista corresponde a la búsqueda. Devuelve un JSON: {\"matchedId\": number | null}.",
            },
            {
              role: "user",
              content: `Búsqueda: "${searchString}". Lista en vivo: ${JSON.stringify(liveListSummary)}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0,
        });

        const matchedJson = JSON.parse(matchFinderRes.choices[0].message.content || "{}");
        if (matchedJson.matchedId) {
          const matchedEvent = liveEvents.find((e: any) => e.id === matchedJson.matchedId);
          if (matchedEvent) {
            matchContext = {
              partidoOficial: `${matchedEvent.homeTeam?.name} vs ${matchedEvent.awayTeam?.name}`,
              minuto: matchedEvent.status?.description || "In-Play",
              marcador: `${matchedEvent.homeScore?.current ?? 0} - ${matchedEvent.awayScore?.current ?? 0}`,
              torneo: matchedEvent.tournament?.name,
            };
          }
        }
      } catch (e) {
        console.warn("No se pudo matchear automáticamente el evento en vivo.");
      }
    }

    // Determinar el minuto y marcador finales a presentar
    const minutoFinal = matchContext?.minuto || minutoUsuario || "En curso";
    const marcadorFinal = matchContext?.marcador || marcadorUsuario || "0-0";

    // 2. PROMPT DINÁMICO SIN VALORES HARDCODED
    const systemPrompt = `
      Eres un In-Play Trader cuantitativo experto en apuestas en vivo.
      
      REGLAS CRÍTICAS DE ANÁLISIS EN VIVO:
      1. Respeta ESTRICTAMENTE el minuto y marcador provistos en el prompt. NUNCA inventes o asumas un minuto o marcador distinto.
      2. Solo debes proponer mercados sobre EVENTOS FUTUROS (lo que ocurrirá desde el minuto provisto hasta el final).
      3. NUNCA sugieras una línea que ya fue alcanzada o superada.

      DEVUELVE UN JSON ESTRICTO CON LA SIGUIENTE ESTRUCTURA:
      {
        "partido": "${searchString}",
        "minuto": "${minutoFinal}",
        "marcadorActual": "${marcadorFinal}",
        "nivelRiesgo": "Bajo" | "Medio" | "Alto",
        "pronosticoPrincipal": {
          "mercado": "Córneres / Tarjetas / Goles en Tiempo Restante",
          "seleccion": "Línea futura precisa para el tiempo restante",
          "cuotaEstimada": 1.85,
          "probabilidadEstimada": 82
        },
        "analisisMomentum": "Explicación del ritmo de juego y presión según el minuto y marcador actual real.",
        "recomendacionStake": "Stake sugerido (Ej: Stake 1.5/5)"
      }
    `;

    const userPrompt = `
      DATOS DEL PARTIDO EN VIVO:
      - Partido: ${matchContext?.partidoOficial || searchString}
      - Torneo: ${matchContext?.torneo || "Liga / Torneo Oficial"}
      - Minuto Actual: ${minutoFinal}
      - Marcador Actual: ${marcadorFinal}

      Genera una proyección In-Play cuantitativa considerando exclusivamente el tiempo restante desde el minuto ${minutoFinal} con el marcador ${marcadorFinal}.
    `;

    const openAiRes = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = JSON.parse(openAiRes.choices[0].message.content || "{}");

    // Asegurar que preserve los datos correctos
    result.minuto = minutoFinal;
    result.marcadorActual = marcadorFinal;

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("Error en /api/analyze-live:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Error procesando el análisis en vivo." },
      { status: 500 }
    );
  }
}