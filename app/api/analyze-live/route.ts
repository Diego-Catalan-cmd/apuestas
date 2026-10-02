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
        { success: false, error: "Por favor, ingresa el nombre de los equipos." },
        { status: 400 }
      );
    }

    // 1. OBTENER EVENTOS EN VIVO Y DEPURAR
    let liveEvents: any[] = [];
    try {
      liveEvents = await getLiveMatchesFromSportAPI();
      console.log(`[In-Play Debug] Eventos en vivo recibidos de SportAPI7: ${liveEvents?.length || 0}`);
    } catch (apiErr) {
      console.error("[In-Play Debug] Error al conectar con SportAPI7:", apiErr);
    }

    let matchContext = null;

    if (liveEvents && liveEvents.length > 0) {
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
              content: `Identifica si el partido buscado existe en la lista en vivo.
              REGLAS:
              - Traduce nombres de países de español a inglés si aplica.
              - Si encuentras coincidencia, devuelve JSON: {"matchedId": number}.
              - Si NO encuentras el partido exacto, devuelve JSON: {"matchedId": null}.`,
            },
            {
              role: "user",
              content: `Búsqueda: "${searchString}". Lista en vivo actual (${liveListSummary.length} partidos): ${JSON.stringify(liveListSummary)}`,
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
            console.log(`[In-Play Debug] Coincidencia encontrada en vivo:`, matchContext);
          }
        }
      } catch (e) {
        console.warn("[In-Play Debug] Error en matcher:", e);
      }
    }

    // 2. BLOQUEAR SI NO HAY CONEXIÓN NI MARCADOR MANUAL
    if (!matchContext && !marcadorUsuario) {
      return NextResponse.json(
        {
          success: false,
          error: `No se pudo conectar con la transmisión en vivo de "${searchString}" en SportAPI7. Para continuar con la proyección, ingresa el marcador y el minuto actual manualmente.`,
        },
        { status: 400 }
      );
    }

    const minutoFinal = matchContext?.minuto || minutoUsuario;
    const marcadorFinal = matchContext?.marcador || marcadorUsuario;

    // 3. GENERAR PROYECCIÓN REAL
    const systemPrompt = `
      Eres un In-Play Trader cuantitativo experto en apuestas en vivo.
      
      REGLAS OBLIGATORIAS:
      1. Evalúa la dinámica considerando el marcador actual (${marcadorFinal}) y minuto (${minutoFinal}).
      2. NUNCA asumas un marcador de 0-0 si el marcador indicado es diferente.

      DEVUELVE UN JSON ESTRICTO:
      {
        "partido": "${matchContext?.partidoOficial || searchString}",
        "minuto": "${minutoFinal}",
        "marcadorActual": "${marcadorFinal}",
        "nivelRiesgo": "Bajo" | "Medio" | "Alto",
        "pronosticoPrincipal": {
          "mercado": "Córneres / Tarjetas / Goles en Tiempo Restante",
          "seleccion": "Línea futura precisa para el tiempo restante",
          "cuotaEstimada": 1.85,
          "probabilidadEstimada": 82
        },
        "analisisMomentum": "Análisis táctico real considerando el marcador ${marcadorFinal} en el minuto ${minutoFinal}.",
        "recomendacionStake": "Stake sugerido (Ej: Stake 1.5/5)"
      }
    `;

    const openAiRes = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Proyección para ${searchString}. Minuto: ${minutoFinal}. Marcador: ${marcadorFinal}.`,
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