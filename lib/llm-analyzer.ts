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

export async function analyzeMatches(
  partidos: MatchAnalysisInput[],
  section: "prematch" | "nations" | "women" = "prematch"
) {
  if (!partidos || partidos.length === 0) {
    throw new Error("No se proporcionaron partidos para analizar.");
  }

  let ligasPermitidas = "";
  let reglasEspecialesSeccion = "";

  if (section === "nations") {
    ligasPermitidas = "UEFA Nations League, Fechas FIFA Masculinas y Femeninas.";
    reglasEspecialesSeccion = "Prioriza Doble Oportunidad y córneres/tarjetas en selecciones de bajo goleo.";
  } else if (section === "women") {
    ligasPermitidas = "UEFA Women's Champions League (UWCL), NWSL (EE.UU.), Liga F (España), WSL (Inglaterra) y Ligas Femeninas Top.";
    reglasEspecialesSeccion = `
      REGLAS DE FÚTBOL FEMENINO:
      - Reconoce la alta brecha cualitativa entre potencias femeninas y equipos de menor presupuesto.
      - Ajusta las líneas de gol: En equipos dominantes (ej: Barcelona F., Lyon F., Chelsea F.), privilegia líneas de 'Más de 2.5 goles' o 'Más de 0.5/1.5 goles en el 1T'.
      - Considera la alta concentración de saques de esquina a favor del equipo con mayor posesión ofensiva.
    `;
  } else {
    ligasPermitidas = "Champions League, La Liga, Bundesliga, Premier League, MLS (EE.UU.), y ligas de Chile, Brasil, Argentina, Colombia, Perú (Liga 1) y Uruguay (Liga AUF).";
    reglasEspecialesSeccion = "Aplica análisis estándar de racha reciente por equipo sin considerar H2H histórico.";
  }

  const promptSistema = `
    Actúa como un Analista Cuantitativo Deportivo de Alto Rendimiento experto en Apuestas y Estadística de Fútbol.
    Sección actual de análisis: ${section.toUpperCase()} (${ligasPermitidas}).
    Tu objetivo es emitir pronósticos de ALTA CERTEZA (Probabilidad Estimada > 80% / Estrategia Banker).

    ${reglasEspecialesSeccion}

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
       - Queda strictly PROHIBIDO recomendar 'Menos de 2.5', 'Menos de 1.5' o 'Menos de 4.5' si los equipos muestran dinámica ofensiva constante.
       - Recomienda mercados con alto respaldo estadístico:
         * Goles: 'Más de 1.5 goles totales', 'Más de 2.5 goles totales' (si aplica en Femenino/Top goliadores), 'Ambos Anotan' o 'Más de 0.5 goles en 1T'.
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
          "partido": "Nombre del Partido (Ej: Barcelona (F) vs Roma (F) o Alianza Lima vs Universitario)",
          "esquema_tactico_estimado": "Formación estimada",
          "analisis_contextual": "Explicación detallada de la racha individual de cada equipo/club.",
          "pronosticos": [
            {
              "pronostico_sugerido": "Mercado de Alta Certeza (Ej: Más de 2.5 Goles Totales o Doble Oportunidad 1X)",
              "probabilidad_estimada": 86,
              "confianza": "Alta",
              "justificacion": "Justificación basada en los promedios anotadores y dinámica táctica del torneo."
            }
          ]
        }
      ],
      "combinada_sugerida": {
        "cuota_total_estimada": 2.10,
        "justificacion_global": "Combinada Banker de alta certidumbre construida sobre métricas recientes."
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