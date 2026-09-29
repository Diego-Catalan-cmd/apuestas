import { NextResponse } from "next/server";
import { analyzeMatches } from "@/lib/llm-analyzer";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    let listToAnalyze: any[] = [];

    if (body.partidos && Array.isArray(body.partidos) && body.partidos.length > 0) {
      listToAnalyze = body.partidos;
    } else if ((body.homeTeam && body.awayTeam) || (body.teamA && body.teamB)) {
      const home = body.homeTeam || body.teamA;
      const away = body.awayTeam || body.teamB;
      listToAnalyze = [
        {
          homeTeam: home,
          awayTeam: away,
          tournament: "UEFA Nations League / Fecha FIFA",
        },
      ];
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Se requieren los nombres de ambos países o selecciones para realizar el análisis.",
        },
        { status: 400 }
      );
    }

    // Llama a la función centralizada con las reglas estrictas de no-H2H y métricas por país
    const analysis = await analyzeMatches(listToAnalyze);

    return NextResponse.json({ success: true, data: analysis });
  } catch (error: any) {
    console.error("Error en /api/analyze-nations:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error interno del servidor al analizar selecciones." },
      { status: 500 }
    );
  }
}