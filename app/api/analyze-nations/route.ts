import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { partidos } = await req.json();

    if (!partidos || partidos.length === 0) {
      return NextResponse.json(
        { success: false, error: "Ingresa al menos un partido de selecciones." },
        { status: 400 }
      );
    }

    const promptSistema = `
      Actúa como un Analista Cuantitativo de Apuestas Deportivas de Alto Rendimiento. Tu objetivo principal es generar pronósticos con una PROBABILIDAD DE ÉXITO SUPERIOR AL 80% (Estrategia Banker / Stake Alto).

      REGLAS STRICTAS DE FILTRADO Y SEGURIDAD (OBLIGATORIO):
      1. PROBABILIDAD MÍNIMA: Cada pronóstico devuelto DEBE tener una "probabilidad_estimada" de al menos 80% (entre 80% y 95%).
      2. MODO LÍNEA CONSERVADORA: EVITA mercados de alto riesgo como 'Más de 2.5 goles', 'Ambos Anotan: SÍ' o victorias directas si el partido es parejo.
      3. UTILIZA MERCADOS DE COBERTURA Y ALTA CERTEZA:
         - Goles: 'Más de 1.5 goles totales', 'Menos de 3.5 o 4.5 goles totales', 'Más de 0.5 goles en el partido'.
         - Hándicaps / Doble Oportunidad: 'Gana o Empata (1X / X2)', 'Hándicap +1.5 o +2.0 a favor del no favorito'.
         - Córneres: 'Más de 6.5 o 7.5 Córneres totales del partido'.
         - Tarjetas: 'Más de 1.5 o 2.5 Tarjetas totales'.

      ANÁLISIS TÁCTICO BÁSICO:
      - Evalúa el esquema táctico (ej: 4-3-3 vs 5-3-2), la cohesión de la selección y si la brecha de nivel entre ambos países justifica una línea de alta seguridad.

      DEVOLUCIÓN OBLIGATORIA EN JSON ESTRICTO:
      {
        "cupon_analisis": [
          {
            "partido": "Nombre del Partido (Ej: España vs Suiza)",
            "esquema_tactico_estimado": "Ej: España (4-3-3) vs Suiza (5-3-2)",
            "analisis_contextual": "Explicación táctica justificando por qué este mercado conservador tiene un margen de seguridad tan elevado.",
            "pronosticos": [
              {
                "pronostico_sugerido": "Línea Conservadora (Ej: España o Empata y Menos de 4.5 goles)",
                "probabilidad_estimada": 85,
                "confianza": "Alta",
                "justificacion": "Detalle técnico de por qué la probabilidad supera el 80%."
              }
            ]
          }
        ],
        "combinada_sugerida": {
          "cuota_total_estimada": 2.10,
          "justificacion_global": "Combinada 'Banker' compuesta exclusivamente por líneas conservadoras con probabilidad individual superior al 80%."
        }
      }
    `;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        { role: "system", content: promptSistema },
        {
          role: "user",
          content: `Genera únicamente pronósticos 'Banker' (Probabilidad > 80%) para los siguientes partidos: ${JSON.stringify(partidos)}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // Temperatura baja para respuestas más conservadoras y coherentes
    });

    const resultadoTexto = response.choices[0]?.message?.content;
    const data = resultadoTexto ? JSON.parse(resultadoTexto) : null;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error en API Nations League:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error procesando el análisis de Nations League." },
      { status: 500 }
    );
  }
}