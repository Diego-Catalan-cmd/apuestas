import { NextResponse } from 'next/server';
import { analyzeMatches } from '@/lib/llm-analyzer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    let listToAnalyze: any[] = [];

    // 1. Si el cliente envía una lista de partidos en 'partidos'
    if (body.partidos && Array.isArray(body.partidos) && body.partidos.length > 0) {
      listToAnalyze = body.partidos;
    } 
    // 2. Si se envía un solo partido en la raíz (homeTeam/awayTeam o teamA/teamB)
    else if ((body.homeTeam && body.awayTeam) || (body.teamA && body.teamB)) {
      const home = body.homeTeam || body.teamA;
      const away = body.awayTeam || body.teamB;
      listToAnalyze = [{ homeTeam: home, awayTeam: away, partido: `${home} vs ${away}` }];
    } 
    else {
      return NextResponse.json(
        { success: false, error: 'Se requieren los nombres de ambos equipos para realizar el análisis.' },
        { status: 400 }
      );
    }

    const analysis = await analyzeMatches(listToAnalyze);

    return NextResponse.json({ success: true, data: analysis });
  } catch (error: any) {
    console.error('Error en /api/analyze:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}