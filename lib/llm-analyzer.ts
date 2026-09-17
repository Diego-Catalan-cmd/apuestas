// lib/llm-analyzer.ts
import { OpenAI } from 'openai';

// Inicializamos el cliente de OpenAI de manera segura con tu API Key del archivo .env.local
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeMatches(partidos: any): Promise<any> {
  // PROMPT MAESTRO COMPLETO: Mantiene la lógica multivariable, libre y sin límites de cuotas
  const promptSistema = `
    Actúa como un Analista de Datos de Élite y Pronosticador Cuantitativo especializado en Modelado Predictivo para Apuestas Deportivas de Fútbol.
    Tu objetivo es evaluar un cupón dinámico que contiene múltiples partidos de fútbol de forma simultánea.

    INSTRUCCIONES DE ANÁLISIS DE DATOS:
    1. Análisis Libre y sin Techos: Evalúa el rendimiento puro de los equipos sin restringirte a un rango de cuotas (elimina el techo de 2.00 a 5.00). Busca la probabilidad matemática más sólida.
    2. Enfoque Multivariable: No te limites a quién gana el partido. Analiza y sugiere pronósticos libres en base a los datos para cualquiera de los siguientes mercados si encuentras valor real:
        - Córneres Totales o por Equipo (Más/Menos)
        - Tiros Totales o Tiros Directos al Arco
        - Tarjetas Amarillas / Faltas Cometidas
        - Ambos Equipos Anotan (Sí/No)
        - Total de Goles del Partido (Líneas de Más/Menos de 1.5, 2.5, 3.5, etc.)
        - Victoria Simple o Hándicaps
    3. Contraste de Contexto y Competición: Evalúa si las rachas recientes de los equipos son sostenibles considerando la dificultad del rival actual y la importancia del torneo (ej: sopesa la diferencia entre jugar una liga local menor frente a un partido crucial de UEFA Champions League).

    REGLA DE FORMATO CRÍTICA:
    Debes devolver la respuesta ESTRICTAMENTE en el siguiente formato de objeto JSON para que mi backend pueda parsearlo. No agregues texto de introducción ni cierres, solo el objeto JSON:

    {
      "cupon_analisis": [
        {
          "partido": "Nombre del Partido (Ej: Manchester City vs FC Barcelona)",
          "analisis_contextual": "Explicación concisa de 2 o 3 líneas detallando por qué la racha se mantiene o se frena, justificando el mercado elegido mediante estadísticas de córneres, tiros, goles o tarjetas.",
          "pronostico_sugerido": "El mercado exacto recomendado (Ej: 'Más de 5.5 córneres del Manchester City' o 'Más de 2.5 goles totales')",
          "probabilidad_estimada": 85, 
          "confianza": "Alta" 
        }
      ],
      "combinada_sugerida": {
        "cuota_total_estimada": 3.45,
        "justificacion_global": "Resumen estratégico de por qué estos pronósticos combinados arman un cupón inteligente de alta probabilidad."
      }
    }

    REGLA DE SEGURIDAD: Basa tus predicciones estrictamente en un razonamiento lógico derivado de los datos provistos. Si un equipo grande se enfrenta a un bloque defensivo cerrado de élite, penaliza sus expectativas de goles y busca valor en mercados alternativos como córneres o faltas.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: promptSistema },
        { role: 'user', content: `Analiza minuciosamente los siguientes partidos para armar el cupón: ${JSON.stringify(partidos)}` }
      ],
      // Forzamos a gpt-4o a devolver un JSON estructurado perfecto
      response_format: { type: "json_object" }
    });

    const resultadoTexto = response.choices[0]?.message?.content;
    if (!resultadoTexto) return null;

    const parsedData = JSON.parse(resultadoTexto);

    // Mapeo defensivo con tipos explícitos para evitar TS7006 en Render
    if (parsedData.cupon_analisis && Array.isArray(parsedData.cupon_analisis)) {
      const primerPartido = parsedData.cupon_analisis[0];

      return {
        ...parsedData,
        summary: parsedData.combinada_sugerida?.justificacion_global || primerPartido?.analisis_contextual || "Análisis cuantitativo procesado correctamente.",
        riskLevel: primerPartido?.confianza === "Alta" ? "Bajo" : "Medio",
        riskJustification: "Basado en evaluación cuantitativa multivariable y contexto de competición.",
        optimalSelection: primerPartido?.pronostico_sugerido || "Sin selección",
        estimatedOdds: parsedData.combinada_sugerida?.cuota_total_estimada || 1.85,
        analysisConfirmed: true,
        markets: parsedData.cupon_analisis.map((item: any) => ({
          market: item.partido,
          selection: item.pronostico_sugerido,
          odds: `${item.probabilidad_estimada}% Prob.`
        })),
        reasoning: parsedData.cupon_analisis.map((p: any) => `• ${p.partido}: ${p.analisis_contextual}`).join('\n\n')
      };
    }

    return parsedData;
  } catch (error) {
    console.error("Error crítico en la llamada a OpenAI:", error);
    throw error;
  }
}

// Exportación secundaria para garantizar retrocompatibilidad
export const analyzeMatch = analyzeMatches;