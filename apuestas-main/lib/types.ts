/**
 * Tipos de datos para el análisis de apuestas deportivas
 */

export interface MatchRequest {
  partidos: PartidoRequest[];
}

export interface PartidoRequest {
  teamA: string;
  teamB: string;
}

export interface MatchData {
  matchId: string;
  teamA: string;
  teamB: string;
  date: string;
  time: string;
  league: string;
  status: "scheduled" | "live" | "finished";
  odds: OddsData;
  lineups: LineupsData;
  injuries: InjuriesData;
  historicalStats?: HistoricalStats;
}

export interface HistoricalStats {
  sampleSize: number;
  homeTeam: TeamAverages;
  awayTeam: TeamAverages;
}

export interface TeamAverages {
  goals: number | null;
  corners: number | null;
  shotsOnTarget: number | null;
  cards: number | null;
  fouls: number | null;
}

export interface OddsData {
  home: number; // odds para victoria local
  draw: number; // odds para empate
  away: number; // odds para victoria visitante
  over2_5: number; // más de 2.5 goles
  under2_5: number; // menos de 2.5 goles
  bothTeamsScore: number; // ambos equipos anotan
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

export interface PlayerInfo {
  id: string;
  name: string;
  position: string;
  number: number;
  injured: boolean;
  rating?: number;
}

export interface InjuriesData {
  homeTeam: InjuryInfo[];
  awayTeam: InjuryInfo[];
}

export interface InjuryInfo {
  player: string;
  type: string;
  returnDate?: string;
}

export interface BettingAnalysis {
  analysisConfirmed: boolean;
  summary: string;
  riskLevel: "Alto" | "Medio" | "Bajo";
  riskJustification: string;
  optimalSelection: string;
  markets: MarketSelection[];
  estimatedOdds: number | null;
  reasoning: string;
}

export interface MatchPrediction extends BettingAnalysis {
  matchInfo: Pick<MatchData, "matchId" | "teamA" | "teamB" | "league" | "date" | "time">;
}

export interface BatchBettingAnalysis {
  predictions: MatchPrediction[];
  couponSummary?: string;
  couponReasoning?: string;
}

export interface MarketSelection {
  market: string;
  selection: string;
  odds?: number;
  probability?: number;
}

export interface ApiResponse<T = BatchBettingAnalysis> {
  success: boolean;
  data?: T;
  error?: string;
}
