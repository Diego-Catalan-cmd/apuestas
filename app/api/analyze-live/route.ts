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
    if (typeof body.partido === "string" && body.partido.trim() !== "") {
      searchString = body.partido.trim();
    } else if (Array.isArray(body.partidos) && body.partidos.length > 0) {
      const p = body.partidos[0];
      searchString = `${p.homeTeam || p.local || ""} vs ${p.awayTeam || p.visitante || ""}`.trim();
    } else if (body.homeTeam && body.awayTeam) {
      searchString = `${body.homeTeam} vs ${body.awayTeam}`;
    }

    if (!searchString || searchString === "vs") {
      return NextResponse.json(
        { success: false, error: "Por favor, ingresa los nombres de los equipos para el análisis en vivo." },
        { status: 400 }
      );
    }

    // 1. OBTENER EVENTOS EN VIVO DESDE SPORTAPI7
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

      // Intentar vincular con OpenAI si está en la lista de SportAPI7
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

    // 2. PROMPT IN-PLAY CON REGLA ESTRICTA DE LIGAS Y MERCADOS FUTUROS
    const systemPrompt = `
      Eres un In-Play Trader cuantitativo experto en apuestas en vivo.
      ALCANCE DE LIGAS PERMITIDAS EN ESTA SECCIÓN:
      - Champions League, La Liga (España), Bundesliga (Alemania), Premier League (Inglaterra).
      - UEFA Nations League y Fechas FIFA.
      - Ligas locales exclusivamente de: CHILE (Primera División/Copa Chile), BRASIL (Brasileirão/Copa do Brasil) y ARGENTINA (Liga Profesional/Copa de la Liga).

      REGLAS CRÍTICAS DE ANÁLISIS EN VIVO:
      1. Solo debes proponer mercados sobre EVENTOS FUTUROS (lo que ocurrirá desde el minuto actual hasta el final).
      2. NUNCA sugieras una línea que ya fue alcanzada en el partido.
      3. Propon estadísticas de alta certidumbre en córneres adicionados, tarjetas finales o goles en el tramo restante.

      DEVUELVE UN JSON ESTRICTO CON LA SIGUIENTE ESTRUCTURA:
      {
        "partido": "${searchString}",
        "minuto": 65,
        "marcadorActual": "1-0",
        "nivelRiesgo": "Bajo" | "Medio" | "Alto",
        "pronosticoPrincipal": {
          "mercado": "Córneres / Tarjetas / Goles en Tiempo Restante",
          "seleccion": "Línea futura precisa (Ej: '+2.5 córneres para el equipo local en los min restantes')",
          "cuotaEstimada": 1.85,
          "probabilidadEstimada": 82
        },
        "mercadosAlternativos": [
          {
            "categoria": "Córneres" | "Tarjetas" | "Goles",
            "sugerencia": "Sugerencia in-play concreta",
            "confianza": "Alta"
          }
        ],
        "analisisMomentum": "Explicación del ritmo de juego y presión ofensiva en los minutos finales.",
        "recomendacionStake": "Stake sugerido (Ej: Stake 1.5/5)"
      }
    `;

    const userPrompt = matchContext
      ? `
        DATOS DE SPORTAPI7 EN VIVO:
        - Partido: ${matchContext.partidoOficial}
        - Torneo: ${matchContext.torneo}
        - Minuto/Estado: ${matchContext.minuto}
        - Marcador en vivo: ${matchContext.marcador}

        Genera el análisis In-Play sobre lo que ocurrirá en el tiempo restante.
      `
      : `
        ANÁLISIS DE PARTIDO EN VIVO SOLICITADO:
        - Partido: ${searchString}
        
        No se detectó el partido en la API en tiempo real en este instante; genera una proyección in-play cuantitativa estándar basada en la tendencia habitual del tramo final para ambos equipos.
      `;

    const openAiRes = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const result = JSON.parse(openAiRes.choices[0].message.content || "{}");

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("Error en /api/analyze-live:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Error procesando el análisis en vivo." },
      { status: 500 }
    );
  }
}