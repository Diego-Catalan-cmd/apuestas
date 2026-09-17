import { NextRequest, NextResponse } from "next/server";
import { searchMatch, getTimeUntilMatch } from "@/lib/api-football";
import { analyzeMatch } from "@/lib/llm-analyzer";
import { MatchRequest, ApiResponse, BettingAnalysis } from "@/lib/types";

/**
 * POST /api/analyze
 * Endpoint orquestador:
 * 1. Procesa peticiones (soporta homeTeam/awayTeam y compatibilidad con teamA/teamB).
 * 2. Consulta datos en API-Football.
 * 3. Analiza el encuentro mediante el orquestador cuantitativo (OpenAI con fallback a Gemini/Groq).
 * 4. Devuelve la predicción sin restricciones de cuotas artificiales.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();

    // Normalización de nombres (soporta el estándar homeTeam/awayTeam y legado teamA/teamB)
    const homeTeam = body.homeTeam || body.teamA;
    const awayTeam = body.awayTeam || body.teamB;

    if (!homeTeam || !awayTeam) {
      return NextResponse.json(
        {
          success: false,
          error: "Se requieren los nombres de ambos equipos (homeTeam y awayTeam)",
        },
        { status: 400 }
      );
    }

    // 1. Obtención de estadísticas históricas y alineaciones
    console.log(`[API] Buscando datos: ${homeTeam} vs ${awayTeam}`);
    const matchData = await searchMatch(homeTeam, awayTeam);

    if (!matchData) {
      return NextResponse.json(
        {
          success: false,
          error: `No se encontraron datos para el partido entre ${homeTeam} y ${awayTeam}`,
        },
        { status: 404 }
      );
    }

    // 2. Control de ventana de tiempo previa al encuentro
    const hoursUntilMatch = getTimeUntilMatch(matchData.date, matchData.time);
    
    console.log(`[API] Partido: ${matchData.homeTeam} vs ${matchData.awayTeam}`);
    console.log(`[API] Horas restantes: ${hoursUntilMatch.toFixed(2)}h`);

    if (hoursUntilMatch > 1.5) {
      return NextResponse.json(
        {
          success: false,
          error: `🟡 STANDBY - Faltan ${hoursUntilMatch.toFixed(1)} horas. Vuelve 45 minutos antes del partido para contar con alineaciones confirmadas.`,
        },
        { status: 202 }
      );
    }

    // 3. Ejecución del modelo analítico cuantitativo
    console.log("[API] Generando análisis cuantitativo con el Agente...");
    const analysis: BettingAnalysis = await analyzeMatch(matchData);

    // 4. Respuesta estructurada al cliente
    return NextResponse.json(
      {
        success: true,
        data: {
          ...analysis,
          matchInfo: {
            homeTeam: matchData.homeTeam,
            awayTeam: matchData.awayTeam,
            league: matchData.league,
            date: matchData.date,
            time: matchData.time,
          },
        } as BettingAnalysis & { matchInfo: any },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API Error]:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido en el servidor";

    return NextResponse.json(
      {
        success: false,
        error: `Error procesando el análisis: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analyze
 * Endpoint de estado y documentación de la API
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok",
    message: "Servicio de análisis cuantitativo de apuestas activo",
    usage: {
      method: "POST",
      path: "/api/analyze",
      body: {
        homeTeam: "Nombre del equipo local",
        awayTeam: "Nombre del equipo visitante",
      },
    },
  });
}