import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MatchAnalysisInput {
  homeTeam: string;
  awayTeam: string;
  tournament?: string;
  // Métricas opcionales si se consumen desde una API externa (ej: sportsfutbol)
  homeStats?: {
    golesFavorUltimos5?: number;
    golesContraUltimos5?: number;
    promedioCorneres?: number;
    promedioTarjetas?: number;
    rachaResultados?: string[]; // Ej: ["G 3-2", "G 2-1", "E 1-1"]
  };
  awayStats?: {
    golesFavorUltimos5?: number;
    golesContraUltimos5?: number;
    promedioCorneres?: number;
    promedioTarjetas?: number;
    rachaResultados?: string[];
  };
}

export async function analyzeMatches(partidos: MatchAnalysisInput[]) {
  if (!partidos || partidos.length === 0) {
    throw new Error("No se proporcionaron partidos para analizar.");
  }

  const promptSistema = `
    Actúa como un Analista Cuantitativo Deportivo de Alto Rendimiento experto en Apuestas y Estadística de Fútbol.
    Tu objetivo es emitir pronósticos de ALTA CERTEZA (Probabilidad Estimada > 80% / Estrategia Banker).

    REGLAS ESTRICTAS DE ANÁLISIS (OBLIGATORIAS):

    1. PROHIBIDO USAR ENCUENTROS PREVIOS (H2H HISTÓRICO):
       - NO consideres partidos entre ambos equipos jugados en años anteriores. Son irrelevantes y desactualizados.

    2. ANÁLISIS INDIVIDUAL POR PAÍS / SELECCIÓN (ESTADO DE FORMA Y MÉTRICAS ACTUALES):
       - Analiza la racha RECIENTE e INDIVIDUAL de cada país por separado.
       - Considera prioritariamente:
         a) Racha de Goles A Favor (Ej: Si España viene marcando 2 o 3 goles por partido recientemente).
         b) Racha de Goles En Contra (Vulnerabilidad o solidez defensiva reciente).
         c) Producción de Córneres promedio por partido.
         d) Faltas e intensidad (Tarjetas).

    3. SELECCIÓN DE MERCADOS DE ALTA CERTEZA (>80% PROBABILIDAD):
       - Si la racha de ambos países muestra partidos dinámicos y con goles encajados/anotados, NO recomiendes 'Menos de 2.5' o 'Menos de 4.5' por defecto. Recomienda mercados realistas apoyados en la racha:
         * Goles: 'Más de 1.5 goles totales', 'Más de 2.0 goles asiáticos', 'Ambos Anotan' o 'Más de 0.5 goles en 1T'.
         * Córneres: 'Más de 6.5 córneres totales' o 'Más de 7.5 córneres totales'.
         * Oportunidad / Hándicap: 'Doble Oportunidad (1X / X2)', 'Hándicap Asiático +1.5 / +2.0'.
       - Cada selección individual DEBE tener una 'probabilidad_estimada' numérica igual o superior a 80 (entre 80% y 95%).

    4. JUSTIFICACIÓN BASADA EN DATOS REALES DE RACHA:
       - La explicación DEBE citar la racha ofensiva/defensiva individual de cada selección.

    DEVOLUCIÓN OBLIGATORIA EN JSON ESTRICTO:
    {
      "cupon_analisis": [
        {
          "partido": "Nombre del Partido (Ej: España vs Croacia)",
          "esquema_tactico_estimado": "Formación estimada según ritmo actual (Ej: España 4-3-3 ofensivo vs Croacia 4-3-3)",
          "analisis_contextual": "Explicación detallada de la racha de cada país. Ejemplo: España promedia 2.4 goles a favor en sus últimos 5 encuentros y viene de encajar 2 goles ante Inglaterra, mientras Croacia muestra desajustes en balones parados.",
          "pronosticos": [
            {
              "pronostico_sugerido": "Mercado de Alta Certeza (Ej: Más de 1.5 Goles Totales o Más de 7.5 Córneres)",
              "probabilidad_estimada": 85,
              "confianza": "Alta",
              "justificacion": "Basado en la racha anotadora de España (3-2 reciente) y los promedios de córneres/goles en contra de ambos seleccionados."
            }
          ]
        }
      ],
      "combinada_sugerida": {
        "cuota_total_estimada": 2.15,
        "justificacion_global": "Combinada Banker de alta certidumbre construida exclusivamente sobre métricas de racha de goles y córneres por país."
      }
    }
  `;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages: [
      { role: "system", content: promptSistema },
      {
        role: "user",
        content: `Analiza la racha reciente por país (goles a favor, goles en contra, córneres) e ignora H2H histórico para los siguientes partidos: ${JSON.stringify(partidos)}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1, // Mantiene la respuesta enfocada y sin alucinaciones
  });

  const resultadoTexto = response.choices[0]?.message?.content;
  if (!resultadoTexto) {
    throw new Error("No se obtuvo respuesta del modelo de IA.");
  }

  return JSON.parse(resultadoTexto);
}