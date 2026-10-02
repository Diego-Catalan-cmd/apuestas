import axios from "axios";
import { MatchData, OddsData, LineupsData } from "./types";

const API_BASE_URL = "https://sportapi7.p.rapidapi.com/api/v1";

// Helper para obtener las credenciales dinámicamente en tiempo de ejecución
function getApiCredentials() {
  const apiKey =
    process.env.RAPIDAPI_KEY ||
    process.env.FOOTBALL_API_KEY ||
    process.env.NEXT_PUBLIC_RAPIDAPI_KEY ||
    "";
  const apiHost = process.env.RAPIDAPI_HOST || "sportapi7.p.rapidapi.com";

  return { apiKey, apiHost };
}

// Instancia base de Axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor para inyectar dinámicamente los headers en CADA petición HTTP
apiClient.interceptors.request.use((config) => {
  const { apiKey, apiHost } = getApiCredentials();
  config.headers["x-rapidapi-key"] = apiKey;
  config.headers["x-rapidapi-host"] = apiHost;
  return config;
});

// Diccionario de equivalencias español -> inglés para selecciones y clubes principales
const TEAM_NAME_MAP: Record<string, string[]> = {
  // Selecciones añadidas
  "nicaragua": ["nicaragua"],
  "costa rica": ["costa rica"],
  "polonia": ["poland"],
  "rumania": ["romania"],
  "bosnia y herzegovina": ["bosnia & herzegovina", "bosnia and herzegovina", "bosnia"],
  "ucrania": ["ukraine"],
  "irlanda del norte": ["northern ireland"],
  "islas feroé": ["faroe islands"],
  "islas feroe": ["faroe islands"],
  "eslovaquia": ["slovakia"],
  "kazajistán": ["kazakhstan"],
  "kazajistan": ["kazakhstan"],
  "moldavia": ["moldova"],

  // Equipos y selecciones previas
  "españa": ["spain"],
  "alemania": ["germany"],
  "francia": ["france"],
  "inglaterra": ["england"],
  "italia": ["italy"],
  "países bajos": ["netherlands", "holland"],
  "paises bajos": ["netherlands"],
  "república dominicana": ["dominican republic"],
  "republica dominicana": ["dominican republic"],
  "haití": ["haiti"],
  "haiti": ["haiti"],
  "brasil": ["brazil"],
  "croacia": ["croatia"],
  "bélgica": ["belgium"],
  "belgica": ["belgium"],
  "suiza": ["switzerland"],
  "suecia": ["sweden"],
  "dinamarca": ["denmark"],
  "turquía": ["turkey", "turkiye"],
  "turquia": ["turkey"],
  "marruecos": ["morocco"],
  "japón": ["japan"],
  "japon": ["japan"],
  "corea del sur": ["south korea", "korea republic"],
  "costa de marfil": ["ivory coast", "côte d'ivoire", "cote d'ivoire"],
  "uruguay": ["uruguay"],
  "perú": ["peru"],
  "peru": ["peru"],
  "peñarol": ["penarol", "club atletico penarol"],
  "nacional": ["club nacional de football", "nacional montevideo"],
  "universitario": ["universitario de deportes"],
  "alianza lima": ["alianza"],
  "sporting cristal": ["cristal"],
  "melgar": ["fbc melgar"]
};

// Genera una lista de variantes posibles para un equipo
function getTeamVariants(name: string): string[] {
  const clean = name.toLowerCase().trim();
  const translations = TEAM_NAME_MAP[clean] || [];
  return [clean, ...translations];
}

/**
 * Obtiene eventos en vivo directamente desde SportAPI7
 */
export async function getLiveMatchesFromSportAPI() {
  const { apiKey } = getApiCredentials();
  
  if (!apiKey) {
    console.error("[SportAPI7] ERROR CRÍTICO: No se encontró RAPIDAPI_KEY ni FOOTBALL_API_KEY en las variables de entorno.");
    return [];
  }

  try {
    const res = await apiClient.get("/sport/football/events/live");
    return res.data?.events || [];
  } catch (error: any) {
    console.warn(
      "[SportAPI7] Error al obtener eventos en vivo:",
      error.response?.data || error.message
    );
    return [];
  }
}

/**
 * Busca un partido en SportAPI7 especificando opcionalmente la fecha (YYYY-MM-DD)
 */
export async function searchMatch(
  teamA: string, 
  teamB: string, 
  targetDate?: string
): Promise<MatchData> {
  try {
    const { apiKey } = getApiCredentials();
    if (!apiKey) {
      throw new Error("No se ha configurado la clave de API (RAPIDAPI_KEY).");
    }

    // Si no se indica fecha, usa la fecha actual
    const searchDate = targetDate || new Date().toISOString().split("T")[0];
    let targetEvent: any = null;

    // Generar variantes antes de iterar para optimizar recursos
    const teamAVariants = getTeamVariants(teamA);
    const teamBVariants = getTeamVariants(teamB);

    try {
      // 1. Obtener categorías deportivas de la fecha objetivo
      const categoriesRes = await apiClient.get(`/sport/football/${searchDate}/0/categories`);
      const categories = categoriesRes.data?.categories || [];

      // 2. Buscar evento coincidente en la fecha objetivo
      for (const cat of categories) {
        if (targetEvent) break;

        try {
          const eventsRes = await apiClient.get(`/category/${cat.id}/scheduled-events/${searchDate}`);
          const events = eventsRes.data?.events || [];

          targetEvent = events.find((e: any) => {
            const home = e.homeTeam?.name?.toLowerCase() || "";
            const away = e.awayTeam?.name?.toLowerCase() || "";

            const matchA = teamAVariants.some((variant) => home.includes(variant) || away.includes(variant));
            const matchB = teamBVariants.some((variant) => home.includes(variant) || away.includes(variant));

            return matchA && matchB;
          });
        } catch {
          continue;
        }
      }
    } catch (err: any) {
      console.warn(`[SportAPI7] Error al intentar obtener categorías activas para la fecha ${searchDate}:`, err.message);
    }

    // 3. Si no existe en la fecha especificada, lanzar error explícito
    if (!targetEvent) {
      throw new Error(
        `No se encontraron datos reales en SportAPI7 para el partido "${teamA} vs ${teamB}" en la fecha ${searchDate}. Proceso abortado.`
      );
    }

    // 4. Cargar cuotas y alineaciones reales
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
      date: searchDate,
      time: "12:30",
      league: targetEvent.tournament?.name || "Nations League / Selección",
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
 * Calcula las horas restantes hasta el inicio del partido
 */
export function getTimeUntilMatch(
  dateOrTimestamp?: string | number,
  matchTime?: string
): number {
  const now = Date.now();

  if (typeof dateOrTimestamp === "number" && !isNaN(dateOrTimestamp)) {
    return (dateOrTimestamp * 1000 - now) / (1000 * 60 * 60);
  }

  if (typeof dateOrTimestamp === "string" && dateOrTimestamp) {
    const timeStr = matchTime || "12:30";
    const matchDateTime = new Date(`${dateOrTimestamp}T${timeStr}:00`);
    const diff = (matchDateTime.getTime() - now) / (1000 * 60 * 60);
    if (!isNaN(diff)) return diff;
  }

  return 2.2;
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