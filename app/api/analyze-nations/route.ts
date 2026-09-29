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

      1. PROHIBIDO INVENTAR O FABRICAR ESTADÍSTICAS (VERACIDAD OBLIGATORIA):
         - Queda estrictamente PROHIBIDO inventar rachas de goles o marcadores ficticios (ejemplo: NUNCA afirmes que un equipo "marcó en sus últimos 4 partidos" si atraviesa sequía goleadora o bajo goleo).
         - Si una selección tiene dificultades ofensivas o poca efectividad reciente (como Chile o Perú), refleja esa realidad objetiva y NUNCA recomiendes 'Más de 1.5 goles'. En su lugar, usa 'Doble Oportunidad (1X / X2)' del rival/favorito, 'Córneres' o 'Tarjetas'.

      2. PROHIBIDO UTILIZAR ENCUENTROS PREVIOS HISTÓRICOS (H2H):
         - NO consideres enfrentamientos antiguos entre ambos seleccionados. Los H2H de años pasados quedan desactualizados y distorsionan el análisis actual.

      3. SELECCIÓN DE MERCADOS DE ALTA CERTEZA Y PROBABILIDAD (>80%):
         - La "probabilidad_estimada" de cada pronóstico DEBE ser un número entre 80 y 95.
         - Queda estrictamente PROHIBIDO recomendar Hándicap (asiático o europeo).
         - Queda estrictamente PROHIBIDO recomendar mercados de 'Menos de 2.5 goles', 'Menos de 1.5 goles' o 'Menos de 4.5 goles'.
         - SI UN EQUIPO NO TIENE GOL: Prioriza 'Doble Oportunidad (1X / X2)' a favor del equipo más sólido, o mercados neutrales como 'Más de 6.5 córneres totales' o 'Más de 2.5 tarjetas totales'.

      4. JUSTIFICACIÓN TÉCNICA Y REALISTA:
         - Justifica basándote en la realidad táctica y el perfil competitivo actual de los países sin asumir cuotas de gol irreales.

      DEVOLUCIÓN OBLIGATORIA EN JSON ESTRICTO:
      {
        "cupon_analisis": [
          {
            "partido": "Nombre del Partido (Ej: Chile vs EE.UU.)",
            "esquema_tactico_estimado": "Ej: Chile (4-3-3) vs EE.UU. (4-3-3)",
            "analisis_contextual": "Explicación táctica realista del momento actual de cada selección sin inventar estadísticas de goles.",
            "pronosticos": [
              {
                "pronostico_sugerido": "Mercado de Alta Certeza (Ej: Doble Oportunidad X2 o Más de 6.5 Córneres)",
                "probabilidad_estimada": 85,
                "confianza": "Alta",
                "justificacion": "Sustento táctico basado en la solidez del rival y la falta de efectividad del rival sin inventar marcadores."
              }
            ]
          }
        ],
        "combinada_sugerida": {
          "cuota_total_estimada": 2.15,
          "justificacion_global": "Combinada Banker respaldada exclusivamente en Doble Oportunidad y mercados de alta certidumbre con probabilidad individual > 80%."
        }
      }
    `;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        { role: "system", content: promptSistema },
        {
          role: "user",
          content: `Analiza la realidad competitiva actual por país e ignora H2H histórico para los siguientes partidos de selecciones: ${JSON.stringify(partidos)}`,
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