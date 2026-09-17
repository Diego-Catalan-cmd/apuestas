/**
 * Tipos de datos para el análisis cuantitativo de apuestas deportivas
 */

// --- Entradas y Peticiones ---

export interface MatchRequest {
  homeTeam: string;
  awayTeam: string;
  league?: string;
}

export interface PlayerInfo {
  id: string;
  name: string;
  position: string;
  number: number;
  injured: boolean;
  rating?: number;
}

export interface InjuryInfo {
  player: string;
  type: string;
  returnDate?: string;
}

export interface LineupsData {
  homeTeam: {
    formation: string;
    players: PlayerInfo[];
  };
  awayTeam: {
    formation: string;
    players: PlayerInfo[];
  };
}

export interface InjuriesData {
  homeTeam: InjuryInfo[];
  awayTeam: InjuryInfo[];
}

export interface OddsData {
  home: number; // Cuota victoria local
  draw: number; // Cuota empate
  away: number; // Cuota victoria visitante
  over2_5?: number; // Más de 2.5 goles
  under2_5?: number; // Menos de 2.5 goles
  bothTeamsScore?: number; // Ambos equipos anotan
  [key: string]: number | undefined; // Flexibilidad para córneres, tarjetas o tiros
}

export interface MatchData {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  league: string;
  status: "scheduled" | "live" | "finished";
  odds?: OddsData;
  lineups?: LineupsData;
  injuries?: InjuriesData;
}

// --- Salidas y Análisis del Agente IA ---

export interface MarketSelection {
  market: string; // ej: "Córneres Totales", "Tiros a Puerta"
  selection: string; // ej: "Más de 8.5", "Gana Local"
  odds?: number;
}

export interface MatchPrediction {
  match: string; // ej: "Real Madrid vs Barcelona"
  recommended_market: string;
  confidence: number; // Porcentaje de confianza (0 - 100)
  riskLevel: "Alto" | "Medio" | "Bajo";
  reasoning: string;
  markets?: MarketSelection[];
}

export interface BatchBettingAnalysis {
  analysisConfirmed: boolean;
  global_analysis: string; // Evaluación general de la combinada o cupón
  estimatedOdds?: number; // Cuota acumulada o estimada
  predictions: MatchPrediction[]; // Predicción individual para cada partido
}

// Alias de compatibilidad para llamadas individuales o por lote
export type BettingAnalysis = BatchBettingAnalysis;

// --- Respuesta de la API ---

export interface ApiResponse<T = BatchBettingAnalysis> {
  success: boolean;
  data?: T;
  error?: string;
}