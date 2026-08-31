import { NextRequest, NextResponse } from "next/server";
import { searchMatch, getTimeUntilMatch } from "@/lib/api-football";
import { analyzeMatch } from "@/lib/llm-analyzer";
import { MatchRequest, ApiResponse, BettingAnalysis } from "@/lib/types";

/**
 * POST /api/analyze
 * 
 * Endpoint que orquesta todo el flujo:
 * 1. Recibe la solicitud con nombres de equipos
 * 2. Consulta la API deportiva para obtener datos del partido
 * 3. Verifica si el partido es inminente (< 1.5 horas)
 * 4. Inyecta los datos en el Prompt Maestro
 * 5. Llama al LLM para obtener el análisis
 * 6. Devuelve el resultado estructurado
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Parsear solicitud
    const body = await request.json() as MatchRequest;
    const { teamA, teamB } = body;

    if (!teamA || !teamB) {
      return NextResponse.json(
        {
          success: false,
          error: "Se requieren nombres de ambos equipos (teamA, teamB)",
        },
        { status: 400 }
      );
    }

    // 1. Buscar el partido en la API deportiva
    console.log(`Buscando partido: ${teamA} vs ${teamB}`);
    const matchData = await searchMatch(teamA, teamB);

    if (!matchData) {
      return NextResponse.json(
        {
          success: false,
          error: `No se encontró el partido entre ${teamA} y ${teamB}`,
        },
        { status: 404 }
      );
    }

    // 2. Verificar tiempo hasta el partido
    const hoursUntilMatch = getTimeUntilMatch(matchData.date, matchData.time);
    
    console.log(`Partido encontrado: ${matchData.teamA} vs ${matchData.teamB}`);
    console.log(`Horas hasta el partido: ${hoursUntilMatch.toFixed(2)}`);

    if (hoursUntilMatch > 1.5) {
      return NextResponse.json(
        {
          success: false,
          error: `🟡 STANDBY - El partido queda en standby. Faltan ${hoursUntilMatch.toFixed(1)} horas. Espera 45 minutos antes del partido cuando salgan las alineaciones oficiales.`,
        },
        { status: 202 } // 202 Accepted (operación en progreso)
      );
    }

    // 3. Inyectar datos en el Prompt Maestro y analizar con LLM
    console.log("Analizando con IA...");
    const analysis: BettingAnalysis = await analyzeMatch(matchData);

    // 4. Validar que la cuota esté en rango permitido
    if (analysis.estimatedOdds < 2.0 || analysis.estimatedOdds > 5.0) {
      console.warn(
        `Cuota fuera de rango: ${analysis.estimatedOdds}. Ajustando a 2.5`
      );
      analysis.estimatedOdds = 2.5;
    }

    // 5. Responder con el ticket de apuesta
    return NextResponse.json(
      {
        success: true,
        data: {
          ...analysis,
          // Metadata adicional para el frontend
          matchInfo: {
            teamA: matchData.teamA,
            teamB: matchData.teamB,
            league: matchData.league,
            date: matchData.date,
            time: matchData.time,
          },
        } as BettingAnalysis & { matchInfo: any },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido en la API";

    return NextResponse.json(
      {
        success: false,
        error: `Error procesando análisis: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analyze
 * Endpoint de health check
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok",
    message: "Endpoint de análisis de apuestas deportivas activo",
    usage: {
      method: "POST",
      path: "/api/analyze",
      body: {
        teamA: "nombre del equipo local",
        teamB: "nombre del equipo visitante",
      },
    },
  });
}
