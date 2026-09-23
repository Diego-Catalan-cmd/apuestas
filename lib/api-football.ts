import axios from "axios";
import { MatchData, OddsData, LineupsData, InjuriesData } from "./types";

const API_HOST = process.env.RAPIDAPI_HOST || "sportapi7.p.rapidapi.com";
const API_KEY = process.env.RAPIDAPI_KEY || process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
const API_BASE_URL = "https://sportapi7.p.rapidapi.com/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "x-rapidapi-key": API_KEY,
    "x-rapidapi-host": API_HOST,
  },
});

/**
 * Busca un partido en SportAPI con respaldo automático para desarrollo
 */
export async function searchMatch(teamA: string, teamB: string): Promise<MatchData> {
  try {
    if (!API_KEY) {
      throw new Error("Falta la clave RAPIDAPI_KEY en las variables de entorno.");
    }

    const today = new Date().toISOString().split("T")[0];
    let targetEvent: any = null;

    try {
      // 1. Obtener categorías deportivas activas hoy
      const categoriesRes = await apiClient.get(`/sport/football/${today}/0/categories`);
      const categories = categoriesRes.data?.categories || [];

      // 2. Buscar el evento coincidente
      for (const cat of categories) {
        if (targetEvent) break;

        try {
          const eventsRes = await apiClient.get(`/category/${cat.id}/scheduled-events/${today}`);
          const events = eventsRes.data?.events || [];

          targetEvent = events.find((e: any) => {
            const home = e.homeTeam?.name?.toLowerCase() || "";
            const away = e.awayTeam?.name?.toLowerCase() || "";
            const tA = teamA.toLowerCase();
            const tB = teamB.toLowerCase();

            return (home.includes(tA) && away.includes(tB)) || (home.includes(tB) && away.includes(tA));
          });
        } catch {
          continue; // Omitir categorías sin datos
        }
      }
    } catch {
      console.warn("SportAPI no retornó eventos activos para hoy. Usando datos de respaldo.");
    }

    // 3. Si no existe en vivo/programado hoy en la API, usar datos simulados (12:30 hora local)
    if (!targetEvent) {
      console.log(`Generando datos simulados para: ${teamA} vs ${teamB}`);
      return getFallbackMatchData(teamA, teamB, today);
    }

    // 4. Obtener detalles extras si el evento existe
    const eventId = targetEvent.id;
    const [oddsRes, lineupRes] = await Promise.allSettled([
      apiClient.get(`/event/${eventId}/odds`),
      apiClient.get(`/event/${eventId}/lineups`),
    ]);

    const oddsData = oddsRes.status === "fulfilled" ? oddsRes.value.data : null;
    const lineupData = lineupRes.status === "fulfilled" ? lineupRes.value.data : null;

    return {
      matchId: eventId.toString(),
      teamA: targetEvent.homeTeam?.name || teamA,
      teamB: targetEvent.awayTeam?.name || teamB,
      date: today,
      time: "12:30",
      league: targetEvent.tournament?.name || "Liga Principal",
      status: targetEvent.status?.type === "inprogress" ? "live" : "scheduled",
      odds: parseOdds(oddsData),
      lineups: parseLineups(lineupData),
      injuries: { homeTeam: [], awayTeam: [] },
    };
  } catch (error: any) {
    console.error("Error en searchMatch:", error.message);
    throw new Error(`Error procesando la búsqueda: ${error.message}`);
  }
}

/**
 * Calcula las horas restantes usando Timestamp UNIX
 */
export function getTimeUntilMatch(
  dateOrTimestamp?: string | number,
  matchTime?: string
): number {
  const now = Date.now();

  // Si recibe un timestamp UNIX numérico válido
  if (typeof dateOrTimestamp === "number" && !isNaN(dateOrTimestamp)) {
    return (dateOrTimestamp * 1000 - now) / (1000 * 60 * 60);
  }

  // Si recibe fecha en formato string ("2026-08-31")
  if (typeof dateOrTimestamp === "string" && dateOrTimestamp) {
    const timeStr = matchTime || "12:30";
    const matchDateTime = new Date(`${dateOrTimestamp}T${timeStr}:00`);
    const diff = (matchDateTime.getTime() - now) / (1000 * 60 * 60);
    if (!isNaN(diff)) return diff;
  }

  // Respaldo por defecto
  return 2.2;
}

/**
 * Mock data con hora fijada a las 12:30 PM local
 */
function getFallbackMatchData(teamA: string, teamB: string, date: string): MatchData {
  const todayAt1230 = new Date();
  todayAt1230.setHours(12, 30, 0, 0);
  const startTimestampInSeconds = Math.floor(todayAt1230.getTime() / 1000);

  return {
    matchId: "mock-101",
    teamA: teamA.toUpperCase(),
    teamB: teamB.toUpperCase(),
    date: date,
    time: "12:30",
    league: "Serie A / Liga Principal",
    status: "scheduled",
    odds: {
      home: 2.15,
      draw: 3.30,
      away: 3.50,
      over2_5: 1.90,
      under2_5: 1.85,
      bothTeamsScore: 1.80,
    },
    lineups: {
      homeTeam: { formation: "4-3-3", players: [] },
      awayTeam: { formation: "4-4-2", players: [] },
    },
    injuries: {
      homeTeam: [{ player: "Portero Titular", type: "Lesión Muscular", returnDate: "Próxima semana" }],
      awayTeam: [],
    },
  };
}

function parseOdds(oddsResponse: any): OddsData {
  return {
    home: oddsResponse?.odds?.home || 2.15,
    draw: oddsResponse?.odds?.draw || 3.30,
    away: oddsResponse?.odds?.away || 3.50,
    over2_5: 1.85,
    under2_5: 1.95,
    bothTeamsScore: 1.75,
  };
}

function parseLineups(lineupsResponse: any): LineupsData {
  return {
    homeTeam: {
      formation: lineupsResponse?.home?.formation || "4-3-3",
      players: lineupsResponse?.home?.players || [],
    },
    awayTeam: {
      formation: lineupsResponse?.away?.formation || "4-4-2",
      players: lineupsResponse?.away?.players || [],
    },
  };
}