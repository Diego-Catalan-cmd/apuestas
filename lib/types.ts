// lib/types.ts

export interface CuponItem {
  partido: string;
  analisis_contextual: string;
  pronostico_sugerido: string;
  probabilidad_estimada: number;
  confianza: string;
  [key: string]: any;
}

export interface CombinadaSugerida {
  cuota_total_estimada: number;
  justificacion_global: string;
  [key: string]: any;
}

export interface CuponAnalisisResponse {
  cupon_analisis?: CuponItem[];
  combinada_sugerida?: CombinadaSugerida;
  [key: string]: any;
}

export interface MatchPrediction {
  matchId?: string | number;
  homeTeam?: string;
  awayTeam?: string;
  prediction?: string;
  confidence?: number;
  reasoning?: string;
  suggestedBet?: string;
  odds?: number;
  [key: string]: any;
}

export interface BettingAnalysis {
  summary?: string;
  predictions?: MatchPrediction[];
  recommendedBets?: any[];
  riskLevel?: string;
  riskJustification?: string;
  optimalSelection?: string;
  markets?: any[];
  reasoning?: string;
  confidenceScore?: number;
  rawResponse?: string;
  cupon_analisis?: CuponItem[];
  combinada_sugerida?: CombinadaSugerida;
  estimatedOdds?: number;
  analysisConfirmed?: boolean;
  matchInfo?: any;
  [key: string]: any;
}

export type BatchBettingAnalysis = BettingAnalysis & {
  summary?: string;
  riskLevel?: string;
  riskJustification?: string;
  optimalSelection?: string;
  markets?: any[];
  reasoning?: string;
  cupon_analisis?: CuponItem[];
  combinada_sugerida?: CombinadaSugerida;
  estimatedOdds?: number;
  analysisConfirmed?: boolean;
  matchInfo?: any;
  [key: string]: any;
};

export interface MatchData {
  fixtureId?: number;
  teamA?: any;
  teamB?: any;
  teams?: {
    home: { id?: number; name: string; logo?: string };
    away: { id?: number; name: string; logo?: string };
  };
  goals?: { home?: number; away?: number };
  score?: any;
  league?: any; // Acepta tanto un string como un objeto { id, name, country, season }
  fixture?: any;
  date?: string;
  time?: string;
  status?: string;
  [key: string]: any;
}

export interface MatchRequest {
  fixtureId?: number;
  homeTeam?: string;
  awayTeam?: string;
  teamA?: string;
  teamB?: string;
  league?: string;
  date?: string;
  partidos?: any[];
  [key: string]: any;
}

export interface OddsData { [key: string]: any; }
export interface LineupsData { [key: string]: any; }
export interface InjuriesData { [key: string]: any; }
export interface HistoricalStats { [key: string]: any; }
export interface TeamAverages { [key: string]: any; }

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: any;
}