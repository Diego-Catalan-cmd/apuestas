import { NextRequest, NextResponse } from "next/server";
import { searchMatch } from "@/lib/api-football";
import { analyzeMatches } from "@/lib/llm-analyzer";
import { MatchRequest, ApiResponse, BatchBettingAnalysis } from "@/lib/types";

/**
 * POST /api/analyze
 * 
 * Endpoint que orquesta todo el flujo:
 * 1. Recibe una lista dinámica de partidos
 * 2. Consulta en paralelo los datos previos de cada partido
 * 3. Llama al LLM una sola vez con el conjunto consolidado
 * 4. Devuelve el resultado estructurado
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Parsear solicitud
    const body: unknown = await request.json();
    const partidos = (body as Partial<MatchRequest>)?.partidos;

    if (!Array.isArray(partidos) || partidos.length === 0 || partidos.some(
      (partido) => !partido || typeof partido.teamA !== "string" || typeof partido.teamB !== "string"
        || !partido.teamA.trim() || !partido.teamB.trim()
    )) {
      return NextResponse.json(
        {
          success: false,
          error: "Se requiere un arreglo no vacío de partidos con teamA y teamB.",
        },
        { status: 400 }
      );
    }

    console.log(`Buscando ${partidos.length} partido(s) en paralelo`);
    const matchData = await Promise.all(
      partidos.map(({ teamA, teamB }) => searchMatch(teamA.trim(), teamB.trim()))
    );
    const analysis: BatchBettingAnalysis = await analyzeMatches(matchData);

    return NextResponse.json(
      {
        success: true,
        data: analysis,
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
        partidos: [
          { teamA: "nombre del equipo local", teamB: "nombre del equipo visitante" },
        ],
      },
    },
  });
}
