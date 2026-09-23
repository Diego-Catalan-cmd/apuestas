// lib/llm-analyzer.ts
import { OpenAI } from 'openai';
import { CuponAnalisisResponse } from './types';



export async function analyzeMatches(partidos: any): Promise<CuponAnalisisResponse | null> {
  const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
  const promptSistema = `
    Actúa como un Analista de Datos de Élite y Pronosticador Cuantitativo especializado en Modelado Predictivo para Apuestas Deportivas de Fútbol.
    Tu objetivo es evaluar un cupón dinámico que contiene múltiples partidos de fútbol de forma simultánea.

    REGLA DE MULTI-SELECCIÓN (BET BUILDER POR PARTIDO):
    Para CADA partido de la lista, debes sugerir entre 1 y 4 pronósticos/mercados diferentes (MÍNIMO 1, MÁXIMO 4 SELECCIONES POR PARTIDO).
    - Explora diversos ángulos (goles, córneres, tarjetas, tiros a puerta, faltas o resultado).
    - En partidos con mucha dinámica puedes sugerir 2, 3 o 4 selecciones (ej: 'Más de 2.5 goles totales' + 'Más de 8.5 córneres del partido' + 'Más de 3.5 tarjetas').
    - En partidos más cerrados o específicos puedes sugerir solo 1 o 2 selecciones de máxima confianza.
    - Cada selección individual dentro del mismo partido debe incluir su propia probabilidad estimada (%) y su justificación cuantitativa específica.

    REGLA DE PRECISIÓN DE MERCADO (OBLIGATORIA):
    - En mercados de TIROS o REMATES: Especifica SIEMPRE si te refieres a "tiros totales" o "tiros a puerta / al arco", e indica EXPLÍCITAMENTE si es "del partido" o "de un equipo en específico".
      Ejemplos válidos:
      * 'Más de 4.5 tiros al arco de Crystal Palace'
      * 'Más de 12.5 tiros totales de Crystal Palace'
      * 'Más de 22.5 tiros totales del partido'
      * 'Más de 8.5 tiros al arco totales del partido'
      Jamás devuelvas un mercado ambiguo sin definir si es del partido completo o de qué equipo.
    - Aplica esta misma claridad para CÓRNERES, TARJETAS y GOLES (ej: 'Más de 4.5 córneres de Flamengo RJ' o 'Más de 8.5 córneres totales del partido').

    REGLA DE FORMATO CRÍTICA:
    Debes devolver la respuesta ESTRICTAMENTE en el siguiente formato JSON para que el backend pueda parsearlo correctamente. No agregues texto introductorio ni explicaciones fuera del objeto JSON:

    {
      "cupon_analisis": [
        {
          "partido": "Nombre del Partido (Ej: Celtic FC vs Ferencvarosi TC)",
          "analisis_contextual": "Explicación macro del partido (2 o 3 líneas).",
          "pronosticos": [
            {
              "pronostico_sugerido": "Ambos equipos anotan (Sí)",
              "probabilidad_estimada": 85,
              "confianza": "Alta",
              "justificacion": "Racha goleadora de ambos y falencias defensivas en torneos continentales."
            },
            {
              "pronostico_sugerido": "Más de 2.5 goles totales del partido",
              "probabilidad_estimada": 80,
              "confianza": "Alta",
              "justificacion": "Promedio combinado de 3.4 goles por encuentro esta temporada."
            }
          ]
        }
      ],
      "combinada_sugerida": {
        "cuota_total_estimada": 3.45,
        "justificacion_global": "Resumen estratégico de por qué esta combinación de selecciones forma un ticket de alta probabilidad."
      }
    }

    REGLA DE SEGURIDAD Y FILTRO DE CALIDAD:
      1. Basa tus predicciones estrictamente en un razonamiento lógico derivado de los datos provistos. Si un equipo grande se enfrenta a un bloque defensivo cerrado de élite, penaliza sus expectativas de goles y busca valor en mercados alternativos como córneres o tarjetas.
      2. FILTRO DE PROBABILIDAD (OBLIGATORIO): La "probabilidad_estimada" de CADA selección individual en el JSON debe ser estrictamente IGUAL O SUPERIOR A 80 (>= 80%). 
      3. Si un partido es muy parejo o incierto, ajusta las líneas de los mercados a opciones más conservadoras (ej: preferir 'Más de 1.5 goles' en lugar de '2.5', o 'Más de 6.5 córneres del partido' en lugar de '8.5') para garantizar que la probabilidad estimada cumpla el umbral del 80%.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: promptSistema },
        { role: 'user', content: `Analiza minuciosamente los siguientes partidos y genera los Bet Builders (1 a 4 selecciones por partido): ${JSON.stringify(partidos)}` }
      ],
      response_format: { type: "json_object" }
    });

    const resultadoTexto = response.choices[0]?.message?.content;
    if (!resultadoTexto) return null;

    const parsedData: CuponAnalisisResponse = JSON.parse(resultadoTexto);
    return parsedData;
  } catch (error) {
    console.error("Error crítico en la llamada a OpenAI:", error);
    throw error;
  }
}

export const analyzeMatch = analyzeMatches;