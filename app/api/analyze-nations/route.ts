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
      Actúa como un Analista Cuantitativo de Élite especializado EXCLUSIVAMENTE en Fútbol de Selecciones Nacionales y UEFA Nations League.
      Tu objetivo es evaluar partidos internacionales considerando que la dinámica es radicalmente opuesta al fútbol de clubes.

      VARIABLES CRÍTICAS DE FÚTBOL DE SELECCIONES / NATIONS LEAGUE:
      1. COHESIÓN Y QUÍMICA LIMITADA: Las selecciones tienen pocos días de entrenamiento. Penaliza la fluidez ofensiva colectiva y prioriza mercados de "Bajo volumen de goles" (Under) o jugadas a balón parado (córneres/faltas).
      2. MOTIVACIÓN Y ROTACIONES: Sopesa el incentivo real (Ascenso/Descenso de Liga vs Partido de trámite). En partidos de menor trascendencia, los DTs suelen hacer pruebas tácticas y rotar en el 2do tiempo.
      3. RITMO Y TEMPO TRABADO: Muchos partidos de Nations League sufren bajones de intensidad a partir del minuto 60. Prioriza líneas conservadoras en remates a puerta totales.
      4. DISPARIDAD DE NIVEL ENTRE LIGAS (Liga A vs Liga B/C/D): En Liga A el nivel es parejo y táctico; en Ligas B/C/D suele haber mayor imprecisión y tarjetas.

      REGLAS DE PRECISIÓN DE MERCADO (OBLIGATORIAS):
      - Especifica SIEMPRE si el mercado es del partido o de un equipo.
      - Ejemplos válidos para Nations League:
        * 'Menos de 2.5 goles totales del partido'
        * 'Más de 4.5 córneres de España'
        * 'Ambos equipos anotan: NO'
        * 'Doble oportunidad y Menos de 3.5 goles'

      DEVOLUCIÓN OBLIGATORIA EN JSON ESTRICTO:
      {
        "cupon_analisis": [
          {
            "partido": "Nombre del Partido (Ej: Francia vs Italia)",
            "analisis_contextual": "Análisis de 2-3 líneas enfocando rotaciones, química limitada y motivación en la tabla de Nations League.",
            "pronosticos": [
              {
                "pronostico_sugerido": "Menos de 2.5 goles totales del partido",
                "probabilidad_estimada": 82,
                "confianza": "Alta",
                "justificacion": "Bajo promedio anotador reciente en fechas FIFA y posible rotación en ataque."
              }
            ]
          }
        ],
        "combinada_sugerida": {
          "cuota_total_estimada": 2.85,
          "justificacion_global": "Estrategia de bajo riesgo adaptada al ritmo conservador del fútbol de selecciones."
        }
      }
    `;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        { role: "system", content: promptSistema },
        {
          role: "user",
          content: `Analiza minuciosamente los siguientes partidos de Nations League: ${JSON.stringify(partidos)}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
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