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
      Actúa como un Analista Cuantitativo Deportivo de Alto Rendimiento. Tu objetivo es emitir pronósticos de ALTA CERTEZA (Probabilidad Estimada > 80% / Estrategia Banker).

      REGLAS STRICTAS DE ANÁLISIS Y SEGURIDAD (OBLIGATORIAS):

      1. PROHIBIDO UTILIZAR ENCUENTROS PREVIOS HISTÓRICOS (H2H):
         - NO consideres enfrentamientos antiguos entre ambos seleccionados. Los H2H de años pasados quedan desactualizados y distorsionan el análisis actual.

      2. ANÁLISIS RECIENTE E INDIVIDUAL POR PAÍS:
         - Analiza prioritariamente la racha RECIENTE e INDIVIDUAL de cada país en sus últimos partidos:
           * Racha anotadora (Goles a favor recientes).
           * Racha defensiva (Goles encajados en sus compromisos recientes).
           * Promedio reciente de córneres totales por equipo.
           * Tarjetas e intensidad del juego.

      3. PROBABILIDAD SUPERIOR AL 80% Y SELECCIÓN DE MERCADOS:
         - La "probabilidad_estimada" de cada pronóstico DEBE ser un número entre 80 y 95.
         - Queda estrictamente PROHIBIDO recomendar Hándicap (asiático o europeo).
         - Si la racha de ambos países refleja dinámicas ofensivas o defensas vulnerables, EVITA recomendar 'Menos de 4.5 goles' por defecto. Recomienda líneas realistas basadas en la racha:
           * Goles: 'Más de 1.5 goles totales', 'Ambos Anotan' o 'Más de 0.5 goles en 1T'.
           * Córneres: 'Más de 6.5 córneres totales' o 'Más de 7.5 córneres totales'.
           * Oportunidad / Cobertura: 'Doble Oportunidad (1X / X2)'.
           * Tarjetas: 'Más de 1.5 o 2.5 tarjetas totales'.

      4. JUSTIFICACIÓN TÉCNICA:
         - Cita explícitamente en la justificación la racha reciente de goles o córneres de cada país para sustentar el 80%+ de probabilidad.

      DEVOLUCIÓN OBLIGATORIA EN JSON ESTRICTO:
      {
        "cupon_analisis": [
          {
            "partido": "Nombre del Partido (Ej: España vs Croacia)",
            "esquema_tactico_estimado": "Ej: España (4-3-3 ofensivo) vs Croacia (4-3-3)",
            "analisis_contextual": "Explicación táctica detallando la racha reciente por país (ej: España viene de marcar 3 goles a Inglaterra pero concedió 2, mientras Croacia concede espacios en los extremos).",
            "pronosticos": [
              {
                "pronostico_sugerido": "Mercado de Alta Certeza (Ej: Más de 1.5 Goles Totales o Más de 7.5 Córneres)",
                "probabilidad_estimada": 85,
                "confianza": "Alta",
                "justificacion": "Sustento basado en el promedio reciente de goles a favor/contra y córneres por selección."
              }
            ]
          }
        ],
        "combinada_sugerida": {
          "cuota_total_estimada": 2.15,
          "justificacion_global": "Combinada Banker respaldada exclusivamente en métricas de racha reciente por país con probabilidad individual > 80%."
        }
      }
    `;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        { role: "system", content: promptSistema },
        {
          role: "user",
          content: `Analiza la racha reciente por país (goles, córneres, forma) e ignora H2H histórico para los siguientes partidos: ${JSON.stringify(partidos)}`,
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