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
      Actúa como un Analista Cuantitativo y Director Táctico de Élite especializado EXCLUSIVAMENTE en Fútbol de Selecciones Nacionales y UEFA Nations League.
      Tu objetivo es evaluar partidos internacionales analizando minuciosa y prioritariamente la TÁCTICA, FORMACIONES Y ALINEACIONES.

      VARIABLES CRÍTICAS DE ANÁLISIS (INCLUYENDO FORMACIÓN Y SISTEMA TÁCTICO):
      1. ESQUEMA TÁCTICO Y FORMACIÓN PROBABLE: Evalúa la disposición en el campo (ej: 4-3-3 ofensivo vs 5-3-2 con carrileros, bloque bajo defensivo, doble pivote de contención). Analiza cómo choca el sistema de un equipo contra el del rival.
      2. ALINEACIONES Y BAJAS CLAVE: Evalúa la presencia/ausencia de las figuras principales y el impacto si el entrenador decide rotar en el 11 titular.
      3. COHESIÓN Y QUÍMICA LIMITADA: Las selecciones tienen pocos días de entrenamiento. Esquemas demasiado complejos suelen generar desajustes defensivos.
      4. MOTIVACIÓN Y ROTACIONES: Sopesa la trascendencia en la tabla de Nations League (Ascenso/Descenso vs Partido de trámite/Pruebas tácticas).
      5. RITMO Y TEMPO TRABADO: Tendencia a bajones de intensidad a partir del minuto 60.

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
            "esquema_tactico_estimado": "Ej: Francia (4-3-3 de posesión) vs Italia (3-5-2 con carrileros)",
            "analisis_contextual": "Análisis táctico detallando la formación, el choque de sistemas en medio campo, posibles rotaciones en el 11 titular y la cohesión de equipo.",
            "pronosticos": [
              {
                "pronostico_sugerido": "Menos de 2.5 goles totales del partido",
                "probabilidad_estimada": 82,
                "confianza": "Alta",
                "justificacion": "El esquema defensivo de 5 defensores bloqueará los espacios ante un rival con rotaciones en ataque."
              }
            ]
          }
        ],
        "combinada_sugerida": {
          "cuota_total_estimada": 2.85,
          "justificacion_global": "Estrategia basada en el choque de esquemas defensivos y el ritmo controlado en Nations League."
        }
      }
    `;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        { role: "system", content: promptSistema },
        {
          role: "user",
          content: `Analiza minuciosamente los siguientes partidos de Nations League, incluyendo sus formaciones probables y planteamientos tácticos: ${JSON.stringify(partidos)}`,
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