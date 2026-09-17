import { BatchBettingAnalysis, BettingAnalysis, MatchData, MatchPrediction, MarketSelection } from "./types";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT = `Actúa como un analista cuantitativo de fútbol libre e independiente de las cuotas.
Evalúa exclusivamente el rendimiento estadístico previo al partido y no descartes una selección por su cuota
ni intentes mantenerla dentro de un rango. Busca valor estadístico en múltiples mercados: córneres totales,
tiros directos al arco, tarjetas y faltas, ambos equipos anotan y goles (más/menos). Compara tendencias de
local/visitante, forma reciente, volumen, medias, dispersión, tamaño de muestra y posibles sesgos de los datos.
No inventes datos ausentes: indícalos y reduce la confianza cuando corresponda. Analiza todos los partidos
recibidos en una única respuesta y devuelve solamente JSON válido, sin Markdown ni texto adicional.

La respuesta debe tener esta forma:
{
  "predictions": [{
    "analysisConfirmed": boolean,
    "summary": string,
    "riskLevel": "Alto" | "Medio" | "Bajo",
    "riskJustification": string,
    "optimalSelection": string,
    "markets": [{ "market": string, "selection": string, "odds": number | null, "probability": number | null }],
    "estimatedOdds": number | null,
    "reasoning": string,
    "matchInfo": {
      "matchId": string, "teamA": string, "teamB": string,
      "league": string, "date": string, "time": string
    }
  }],
  "couponSummary": string,
  "couponReasoning": string
}`;

function buildUserPrompt(matches: MatchData[]): string {
  return `Analiza estos partidos pre-partido en conjunto. Las cuotas, si están disponibles, son únicamente
una variable informativa y nunca una restricción. Usa todos los datos históricos y promedios agregados
incluidos por partido:

${JSON.stringify(matches)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function parseMarket(value: unknown): MarketSelection {
  const market = isRecord(value) ? value : {};
  const odds = market.odds;
  return {
    market: asString(market.market),
    selection: asString(market.selection),
    ...(typeof odds === "number" ? { odds } : {}),
    ...(typeof market.probability === "number" ? { probability: market.probability } : {}),
  };
}

function parsePrediction(value: unknown): MatchPrediction {
  const prediction = isRecord(value) ? value : {};
  const info = isRecord(prediction.matchInfo) ? prediction.matchInfo : {};
  const riskLevel = prediction.riskLevel === "Alto" || prediction.riskLevel === "Bajo"
    ? prediction.riskLevel
    : "Medio";

  return {
    analysisConfirmed: prediction.analysisConfirmed === true,
    summary: asString(prediction.summary),
    riskLevel,
    riskJustification: asString(prediction.riskJustification),
    optimalSelection: asString(prediction.optimalSelection),
    markets: Array.isArray(prediction.markets) ? prediction.markets.map(parseMarket) : [],
    estimatedOdds: typeof prediction.estimatedOdds === "number" ? prediction.estimatedOdds : null,
    reasoning: asString(prediction.reasoning),
    matchInfo: {
      matchId: asString(info.matchId),
      teamA: asString(info.teamA),
      teamB: asString(info.teamB),
      league: asString(info.league),
      date: asString(info.date),
      time: asString(info.time),
    },
  };
}

function parseAnalysisOutput(value: unknown): BatchBettingAnalysis {
  const root = isRecord(value) ? value : {};
  return {
    predictions: Array.isArray(root.predictions) ? root.predictions.map(parsePrediction) : [],
    ...(typeof root.couponSummary === "string" ? { couponSummary: root.couponSummary } : {}),
    ...(typeof root.couponReasoning === "string" ? { couponReasoning: root.couponReasoning } : {}),
  };
}

export async function analyzeMatches(matches: MatchData[]): Promise<BatchBettingAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta la clave OPENAI_API_KEY en las variables de entorno.");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(matches) },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorBody: unknown = await response.json().catch(() => null);
    const message = isRecord(errorBody) && isRecord(errorBody.error)
      ? asString(errorBody.error.message, response.statusText)
      : response.statusText;
    throw new Error(`OpenAI API error (${response.status}): ${message}`);
  }

  const payload: unknown = await response.json();
  const content = isRecord(payload) && Array.isArray(payload.choices) && isRecord(payload.choices[0])
    && isRecord(payload.choices[0].message)
    ? payload.choices[0].message.content
    : null;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenAI devolvió una respuesta vacía o con formato inválido.");
  }

  return parseAnalysisOutput(JSON.parse(content));
}

export async function analyzeMatch(matchData: MatchData): Promise<BettingAnalysis> {
  const result = await analyzeMatches([matchData]);
  const prediction = result.predictions[0];
  if (!prediction) {
    throw new Error("OpenAI no devolvió un análisis para el partido solicitado.");
  }
  return prediction;
}
