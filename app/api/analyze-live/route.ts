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

    // 1. OBTENER EVENTOS EN VIVO Y EMPAREJAR CON MATCHER MULTILINGÜE
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
              content: `Identifica qué evento de la lista corresponde a la búsqueda del usuario.
              REGLAS DE BÚSQUEDA:
              - Traduce nombres de países/equipos de español a inglés si es necesario (ej: "República Dominicana" = "Dominican Republic", "Haití" = "Haiti", "Estados Unidos" = "USA", "Alemania" = "Germany").
              - Ignora tildes, minúsculas, mayúsculas y pequeñas diferencias ortográficas.
              Devuelve un JSON estricto: {"matchedId": number | null}.`
            },
            {
              role: "user",
              content: `Búsqueda: "${searchString}". Lista en vivo actual: ${JSON.stringify(liveListSummary)}`,
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
        console.warn("Error en el matcher de eventos en vivo:", e);
      }
    }

    // 2. VALIDACIÓN DE DATOS
    const minutoFinal = matchContext?.minuto || minutoUsuario;
    const marcadorFinal = matchContext?.marcador || marcadorUsuario;

    // Si la API no detectó el evento y el usuario tampoco ingresó marcador
    if (!matchContext && !marcadorUsuario) {
      return NextResponse.json(
        {
          success: false,
          error: `No se detectó la transmisión en tiempo real para "${searchString}". Por favor, ingresa el marcador actual y el minuto manualmente para realizar la proyección.`,
        },
        { status: 400 }
      );
    }

    // 3. GENERAR PROYECCIÓN IN-PLAY BASADA EN DATOS REALES
    const systemPrompt = `
      Eres un In-Play Trader cuantitativo experto en apuestas en vivo.
      
      REGLAS OBLIGATORIAS:
      1. Evalúa el escenario basándote EXCLUSIVAMENTE en el marcador actual (${marcadorFinal}) y el minuto (${minutoFinal}).
      2. NUNCA asumas un marcador de 0-0 si el marcador indicado es diferente.
      3. Sugiere únicamente líneas futuras para el tiempo restante del partido.

      DEVUELVE UN JSON ESTRICTO CON LA SIGUIENTE ESTRUCTURA:
      {
        "partido": "${matchContext?.partidoOficial || searchString}",
        "minuto": "${minutoFinal}",
        "marcadorActual": "${marcadorFinal}",
        "nivelRiesgo": "Bajo" | "Medio" | "Alto",
        "pronosticoPrincipal": {
          "mercado": "Córneres / Tarjetas / Goles en Tiempo Restante",
          "seleccion": "Línea futura precisa considerando el marcador actual",
          "cuotaEstimada": 1.85,
          "probabilidadEstimada": 82
        },
        "analisisMomentum": "Análisis táctico real considerando que el partido va ${marcadorFinal} en el minuto ${minutoFinal}.",
        "recomendacionStake": "Stake sugerido (Ej: Stake 1.5/5)"
      }
    `;

    const openAiRes = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Genera la proyección In-Play para ${searchString}. Minuto actual: ${minutoFinal}. Marcador actual: ${marcadorFinal}.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = JSON.parse(openAiRes.choices[0].message.content || "{}");
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