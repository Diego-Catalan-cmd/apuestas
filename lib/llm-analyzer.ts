import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MatchAnalysisInput {
  homeTeam: string;
  awayTeam: string;
  tournament?: string;
  homeStats?: {
    golesFavorUltimos5?: number;
    golesContraUltimos5?: number;
    promedioCorneres?: number;
    promedioTarjetas?: number;
    rachaResultados?: string[];
  };
  awayStats?: {
    golesFavorUltimos5?: number;
    golesContraUltimos5?: number;
    promedioCorneres?: number;
    promedioTarjetas?: number;
    rachaResultados?: string[];
  };
}

export async function analyzeMatches(partidos: MatchAnalysisInput[], section: "prematch" | "nations" = "prematch") {
  if (!partidos || partidos.length === 0) {
    throw new Error("No se proporcionaron partidos para analizar.");
  }

  const ligasPermitidas = section === "nations"
    ? "UEFA Nations League y Fechas FIFA."
    : "Champions League, La Liga (España), Bundesliga (Alemania) y Premier League (Inglaterra).";

  const promptSistema = `
    Actúa como un Analista Cuantitativo Deportivo de Alto Rendimiento experto en Apuestas y Estadística de Fútbol.
    Sección actual de análisis: ${section.toUpperCase()} (${ligasPermitidas}).
    Tu objetivo es emitir pronósticos de ALTA CERTEZA (Probabilidad Estimada > 80% / Estrategia Banker).

    REGLAS ESTRICTAS DE ANÁLISIS (OBLIGATORIAS):

    1. PROHIBIDO USAR ENCUENTROS PREVIOS (H2H HISTÓRICO):
       - NO consideres partidos entre ambos equipos jugados en años anteriores. Son irrelevantes y desactualizados.

    2. ANÁLISIS INDIVIDUAL POR EQUIPO / SELECCIÓN (ESTADO DE FORMA Y MÉTRICAS ACTUALES):
       - Analiza la racha RECIENTE e INDIVIDUAL de cada conjunto por separado.
       - Considera prioritariamente:
         a) Racha de Goles A Favor recientes.
         b) Racha de Goles En Contra (solidez o vulnerabilidad defensiva).
         c) Producción promedio de Córneres.
         d) Intensidad y Faltas (Tarjetas).

    3. SELECCIÓN DE MERCADOS DE ALTA CERTEZA (>80% PROBABILIDAD):
       - Queda estrictamente PROHIBIDO recomendar Hándicap Asiático o Hándicap de cualquier tipo.
       - Queda estrictamente PROHIBIDO recomendar 'Menos de 2.5', 'Menos de 1.5' o 'Menos de 4.5' si los equipos muestran dinámica ofensiva constante.
       - Recomienda mercados con alto respaldo estadístico:
         * Goles: 'Más de 1.5 goles totales', 'Ambos Anotan' o 'Más de 0.5 goles en 1T'.
         * Córneres: 'Más de 6.5 córneres totales' o 'Más de 7.5 córneres totales'.
         * Oportunidad / Cobertura: 'Doble Oportunidad (1X / X2)'.
         * Tarjetas: 'Más de 1.5 o 2.5 tarjetas totales'.
       - Cada selección individual DEBE asignar una 'probabilidad_estimada' entre 80% y 95%.

    4. JUSTIFICACIÓN BASADA EN DATOS REALES DE RACHA:
       - La explicación DEBE citar la racha ofensiva/defensiva individual de cada selección o club.

    DEVOLUCIÓN OBLIGATORIA EN JSON ESTRICTO:
    {
      "cupon_analisis": [
        {
          "partido": "Nombre del Partido (Ej: España vs Croacia)",
          "esquema_tactico_estimado": "Formación estimada (Ej: España 4-3-3 vs Croacia 4-3-3)",
          "analisis_contextual": "Explicación detallada de la racha individual de cada equipo.",
          "pronosticos": [
            {
              "pronostico_sugerido": "Mercado de Alta Certeza (Ej: Más de 1.5 Goles Totales o Doble Oportunidad 1X)",
              "probabilidad_estimada": 85,
              "confianza": "Alta",
              "justificacion": "Justificación basada en los promedios anotadores y córneres/tarjetas de cada equipo."
            }
          ]
        }
      ],
      "combinada_sugerida": {
        "cuota_total_estimada": 2.15,
        "justificacion_global": "Combinada Banker de alta certidumbre construida sobre métricas recientes de racha."
      }
    }
  `;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages: [
      { role: "system", content: promptSistema },
      {
        role: "user",
        content: `Analiza la racha reciente por equipo/país (goles a favor, goles en contra, córneres) e ignora el H2H histórico para los siguientes partidos: ${JSON.stringify(partidos)}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const resultadoTexto = response.choices[0]?.message?.content;
  if (!resultadoTexto) {
    throw new Error("No se obtuvo respuesta del modelo de IA.");
  }

  return JSON.parse(resultadoTexto);
}