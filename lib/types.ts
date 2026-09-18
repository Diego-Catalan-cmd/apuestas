// lib/types.ts

// ==========================================
// 1. ESTRUCTURAS DE BET BUILDER Y ANÁLISIS (IA)
// ==========================================

export interface PronosticoItem {
  pronostico_sugerido: string;
  probabilidad_estimada: number;
  confianza: "Alta" | "Media" | "Baja" | string;
  justificacion: string;
}

export interface CuponItem {
  partido: string;
  analisis_contextual: string;
  pronosticos: PronosticoItem[];
}

export interface CombinadaSugerida {
  cuota_total_estimada: number;
  justificacion_global: string;
}

export interface CuponAnalisisResponse {
  cupon_analisis: CuponItem[];
  combinada_sugerida: CombinadaSugerida;
}

// ==========================================
// 2. PETICIONES Y ENTRADA DE DATOS (REQUESTS)
// ==========================================

export interface MatchInput {
  id?: string | number;
  homeTeam: string;
  awayTeam: string;
  partido?: string;
}

export interface MatchRequest {
  fixtureId?: number;
  homeTeam?: string;
  awayTeam?: string;
  teamA?: string;
  teamB?: string;
  league?: string;
  date?: string;
  partidos?: MatchInput[];
  [key: string]: any;
}

// ==========================================
// 3. RESPUESTAS GENERALES DE LA API
// ==========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==========================================
// 4. DATOS DE PARTIDOS Y ESTADÍSTICAS (FIXTURES)
// ==========================================

export interface TeamInfo {
  id?: number;
  name: string;
  logo?: string;
}

export interface MatchData {
  fixtureId?: number;
  teams?: {
    home: TeamInfo;
    away: TeamInfo;
  };
  goals?: {
    home?: number;
    away?: number;
  };
  league?: string | { id?: number; name?: string; country?: string; season?: number };
  fixture?: any;
  date?: string;
  time?: string;
  status?: string;
  [key: string]: any;
}

export type OddsData = Record<string, any>;
export type LineupsData = Record<string, any>;
export type InjuriesData = Record<string, any>;
export type HistoricalStats = Record<string, any>;
export type TeamAverages = Record<string, any>;