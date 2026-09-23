import { NextResponse } from "next/server";

// Función auxiliar para convertir las estadísticas de RapidAPI a un texto claro para la IA
function formatStatsForPrompt(statsArray: any[]): string {
  if (!statsArray || !Array.isArray(statsArray) || statsArray.length === 0) {
    return "Estadísticas detalladas no disponibles.";
  }

  return statsArray
    .map((teamStats) => {
      const teamName = teamStats.team?.name || "Equipo";
      const statsList = teamStats.statistics || [];
      const formattedList = statsList
        .map((s: any) => `${s.type}: ${s.value ?? 0}`)
        .join(", ");
      return `${teamName} -> [${formattedList}]`;
    })
    .join("\n");
}

export async function POST(req: Request) {
  try {
    const { partido } = await req.json();

    if (!partido || partido.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Ingresa el nombre de los equipos o el partido." },
        { status: 400 }
      );
    }

    let liveMatchData: any = null;
    let rapidApiErrorReason: string | null = null;

    // 1. OBTENER DATOS Y ESTADÍSTICAS EN VIVO
    if (process.env.RAPIDAPI_KEY) {
      try {
        const rapidRes = await fetch(
          "https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all",
          {
            headers: {
              "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
              "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
            },
            next: { revalidate: 0 },
          }
        );

        if (rapidRes.ok) {
          const rapidJson = await rapidRes.json();
          const liveFixtures = rapidJson.response || [];

          if (liveFixtures.length > 0) {
            const partidosSimplificados = liveFixtures.map((f: any) => ({
              id: f.fixture.id,
              partido: `${f.teams.home.name} vs ${f.teams.away.name}`,
              minuto: f.fixture.status.elapsed,
              marcador: `${f.goals.home ?? 0} - ${f.goals.away ?? 0}`,
            }));

            const matchFinderRes = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                  {
                    role: "system",
                    content: "Identifica qué partido corresponde a la búsqueda. Devuelve un JSON: {\"matchedId\": number | null}.",
                  },
                  {
                    role: "user",
                    content: `Búsqueda: "${partido}". Lista en vivo: ${JSON.stringify(partidosSimplificados)}`,
                  },
                ],
                response_format: { type: "json_object" },
                temperature: 0,
              }),
            });

            if (matchFinderRes.ok) {
              const matchFinderData = await matchFinderRes.json();
              const matchedJson = JSON.parse(matchFinderData.choices[0].message.content);
              const matchedId = matchedJson.matchedId;

              if (matchedId) {
                const fixtureEncontrado = liveFixtures.find((f: any) => f.fixture.id === matchedId);
                if (fixtureEncontrado) {
                  let statsDetail = null;
                  try {
                    const statsRes = await fetch(
                      `https://api-football-v1.p.rapidapi.com/v3/fixtures/statistics?fixture=${matchedId}`,
                      {
                        headers: {
                          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
                          "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
                        },
                      }
                    );
                    if (statsRes.ok) {
                      const statsData = await statsRes.json();
                      statsDetail = statsData.response;
                    }
                  } catch (e) {
                    console.warn("No se cargaron estadísticas detalladas.");
                  }

                  liveMatchData = {
                    partidoOficial: `${fixtureEncontrado.teams.home.name} vs ${fixtureEncontrado.teams.away.name}`,
                    minuto: fixtureEncontrado.fixture.status.elapsed,
                    marcador: `${fixtureEncontrado.goals.home ?? 0} - ${fixtureEncontrado.goals.away ?? 0}`,
                    statsFormatted: formatStatsForPrompt(statsDetail),
                  };
                }
              }
            }
          }
        } else {
          rapidApiErrorReason = `Error HTTP ${rapidRes.status} de RapidAPI.`;
        }
      } catch (err: any) {
        rapidApiErrorReason = err.message;
      }
    }

    // 2. PROMPT CON REGLA ESTRICTA DE LÍNEAS FUTURAS EN VIVO
    const systemPrompt = `
      Eres un In-Play Trader cuantitativo experto. Tu función es analizar partidos en vivo y proponer mercados de apuestas IN-PLAY que AÚN NO HANYA SUCEDIDO.

      REGLAS DE ORO OBLIGATORIAS:
      1. REVISA LAS ESTADÍSTICAS ACUMULADAS EN EL MINUTO ACTUAL.
      2. JAMÁS recomiendes un mercado o línea que ya se haya alcanzado o superado.
         - Ejemplo INCORRECTO: Si el equipo local ya tiene 3 tarjetas rojas/amarillas en el minuto 70, NO sugieras "Más de 2.5 tarjetas".
         - Ejemplo CORRECTO: "Más de 3.5 tarjetas totales" o "1+ tarjeta para el equipo local entre el min 70-90".
      3. Todas las cuotas y sugerencias deben basarse exclusivamente en LO QUE FALTA POR OCURRIR desde el minuto actual hasta el final del partido.

      MERCADOS DIVERSIFICADOS A CONSIDERAR:
      - Córneres en el tiempo restante (Ej: "Más de 2.5 córneres adicionales para [Equipo]").
      - Tarjetas adicionales por desesperación o faltas al final del partido.
      - Tiros a puerta adicionales en el tramo final.
      - Próximo Gol / Resultado Resto del Partido (Asian Handicap In-Play).

      Responde EXCLUSIVAMENTE en formato JSON estricto:
      {
        "partido": "Nombre del Partido",
        "minuto": 70,
        "marcadorActual": "1-0",
        "nivelRiesgo": "Bajo" | "Medio" | "Alto",
        "pronosticoPrincipal": {
          "mercado": "Córneres / Tarjetas / Tiros / Goles en Tiempo Restante",
          "seleccion": "Línea futura exacta (Ej: 'Atlético Nacional hará +2.5 córneres en los minutos restantes')",
          "cuotaEstimada": 1.85,
          "probabilidadEstimada": 80
        },
        "mercadosAlternativos": [
          {
            "categoria": "Córneres" | "Tarjetas" | "Tiros" | "Goles",
            "sugerencia": "Sugerencia estricta para los minutos restantes",
            "confianza": "Alta" | "Media"
          }
        ],
        "analisisMomentum": "Explicación detallada justificando por qué ocurrirán estos eventos adicionales en los minutos restantes con base en el marcador y la presión.",
        "recomendacionStake": "Stake sugerido para el tramo final (Ej: Stake 1.5/5 por minuto avanzado)"
      }
    `;

    const userPrompt = liveMatchData
      ? `
        DATOS REALES DEL PARTIDO EN EL MINUTO ${liveMatchData.minuto}':
        - Encuentro: ${liveMatchData.partidoOficial}
        - Minuto Actual: ${liveMatchData.minuto}'
        - Marcador en Vivo: ${liveMatchData.marcador}
        
        ESTADÍSTICAS ACUMULADAS HASTA ESTE MINUTO:
        ${liveMatchData.statsFormatted}

        RECUERDA: Propón únicamente apuestas sobre lo que pasará DESDE el minuto ${liveMatchData.minuto}' en adelante. No sugieras líneas por debajo de los acumulados actuales.
      `
      : `
        ANÁLISIS DE PARTIDO EN VIVO:
        - Partido solicitado: ${partido}
        - Nota: ${rapidApiErrorReason || "Genera un análisis in-play proyectando únicamente eventos futuros para el tramo final del partido."}
      `;

    const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    if (!openAiRes.ok) {
      throw new Error("Error de comunicación con el motor de Inteligencia Artificial.");
    }

    const openAiData = await openAiRes.json();
    const result = JSON.parse(openAiData.choices[0].message.content);

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Error al procesar el análisis." },
      { status: 500 }
    );
  }
}