import { NextResponse } from "next/server";
import { OpenAI } from "openai";

export const dynamic = "force-dynamic";

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
      Actúa como un Analista Cuantitativo Deportivo de Alto Rendimiento experto en Selecciones Nacionales y Nations League. Tu objetivo es emitir pronósticos de ALTA CERTEZA (Probabilidad Estimada > 80% / Estrategia Banker).

      REGLAS ESTRICTAS DE ANÁLISIS Y SEGURIDAD (OBLIGATORIAS):

      1. PROHIBIDO UTILIZAR ENCUENTROS PREVIOS HISTÓRICOS (H2H):
         - NO consideres enfrentamientos antiguos entre ambos seleccionados. Los H2H de años pasados quedan desactualizados y distorsionan el análisis actual.

      2. ANÁLISIS RECIENTE E INDIVIDUAL POR PAÍS:
         - Analiza prioritariamente la racha RECIENTE e INDIVIDUAL de cada país en sus últimos partidos:
           * Racha anotadora (Goles a favor recientes).
           * Racha defensiva (Goles encajados en sus compromisos recientes).
           * Promedio reciente de córneres totales por equipo.
           * Tarjetas e intensidad del juego.

      3. SELECCIÓN DE MERCADOS DE ALTA CERTEZA Y PROBABILIDAD (>80%):
         - La "probabilidad_estimada" de cada pronóstico DEBE ser un número entre 80 y 95.
         - Queda estrictamente PROHIBIDO recomendar Hándicap (asiático o europeo).
         - Queda estrictamente PROHIBIDO recomendar mercados de 'Menos de 2.5 goles', 'Menos de 1.5 goles' o 'Menos de 4.5 goles' por su alta volatilidad en partidos internacionales.
         - PRIORIDAD DE MERCADOS DE ALTA CERTEZA:
           * Cobertura Principal (PREFERIDO): 'Doble Oportunidad (1X)' o 'Doble Oportunidad (X2)' a favor de la selección con mejor racha, ritmo o solidez.
           * Goles: 'Más de 1.5 goles totales', 'Más de 0.5 goles en 1T' o 'Ambos Anotan' (si la racha ofensiva de ambas selecciones es alta).
           * Córneres: 'Más de 6.5 córneres totales' o 'Más de 7.5 córneres totales'.
           * Tarjetas: 'Más de 1.5 o 2.5 tarjetas totales'.

      4. JUSTIFICACIÓN TÉCNICA BASADA EN LA RACHA DE CADA PAÍS:
         - Cita explícitamente la racha reciente de goles o córneres de cada selección para sustentar la elección de Doble Oportunidad (1X / X2) o el mercado seleccionado.

      DEVOLUCIÓN OBLIGATORIA EN JSON ESTRICTO:
      {
        "cupon_analisis": [
          {
            "partido": "Nombre del Partido (Ej: Suiza vs Escocia)",
            "esquema_tactico_estimado": "Ej: Suiza (4-2-3-1) vs Escocia (5-4-1)",
            "analisis_contextual": "Explicación táctica detallando la racha reciente por país (ej: Suiza viene de marcar en sus últimos partidos pero concede goles, mientras Escocia sufre defensivamente como visitante).",
            "pronosticos": [
              {
                "pronostico_sugerido": "Mercado de Alta Certeza (Ej: Doble Oportunidad 1X o Más de 1.5 Goles Totales)",
                "probabilidad_estimada": 85,
                "confianza": "Alta",
                "justificacion": "Sustento basado en la solidez/racha del seleccionado favorecido con 1X/X2 e indicadores recientes de ataque."
              }
            ]
          }
        ],
        "combinada_sugerida": {
          "cuota_total_estimada": 2.15,
          "justificacion_global": "Combinada Banker respaldada exclusivamente en Doble Oportunidad y métricas de racha por país con probabilidad individual > 80%."
        }
      }
    `;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        { role: "system", content: promptSistema },
        {
          role: "user",
          content: `Analiza la racha reciente por país (goles, córneres, forma) e ignora H2H histórico para los siguientes partidos de selecciones: ${JSON.stringify(partidos)}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
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