# 🏗️ Arquitectura de la Aplicación

## 📊 Diagrama General

```
┌─────────────────────────────────────────────────────────────────┐
│                    BETTING ANALYZER MVP                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│   BROWSER (Frontend)     │
│                          │
│  ┌──────────────────┐   │
│  │ MatchSearcher    │   │
│  │  - Input Form    │   │
│  │  - Loading State │   │
│  │  - Error Display │   │
│  └──────┬───────────┘   │
│         │               │
│  ┌──────▼───────────┐   │
│  │ BettingTicket    │   │
│  │  - Risk Badge    │   │
│  │  - Markets List  │   │
│  │  - Odds Display  │   │
│  └──────────────────┘   │
│                          │
└──────────────┬───────────┘
               │
               │ POST /api/analyze
               │ {teamA, teamB}
               │
               ▼
        ┌──────────────────────────────────────────┐
        │     NEXT.JS SERVER (Backend)              │
        │                                            │
        │  ┌────────────────────────────────────┐  │
        │  │  Route Handler: /api/analyze       │  │
        │  │                                    │  │
        │  │  1. Parse Request                  │  │
        │  │  2. Call searchMatch()             │  │
        │  │  3. Calculate Time                 │  │
        │  │  4. Call analyzeMatch()            │  │
        │  │  5. Return JSON Response           │  │
        │  └────────┬──────────────────────────┘  │
        │           │                              │
        │  ┌────────▼──────────────────────────┐  │
        │  │  lib/api-football.ts              │  │
        │  │                                    │  │
        │  │  - searchMatch()                   │  │
        │  │  - getMatchDetails()               │  │
        │  │  - parseOdds()                     │  │
        │  │  - parseLineups()                  │  │
        │  │  - parseInjuries()                 │  │
        │  │  - getTimeUntilMatch()             │  │
        │  └────────┬──────────────────────────┘  │
        │           │                              │
        │  ┌────────▼──────────────────────────┐  │
        │  │  lib/llm-analyzer.ts              │  │
        │  │                                    │  │
        │  │  - buildMasterPrompt()             │  │
        │  │  - analyzeWithOpenAI()             │  │
        │  │  - analyzeWithGemini()             │  │
        │  │  - analyzeMatch()                  │  │
        │  └────────┬──────────────────────────┘  │
        │           │                              │
        └───────────┼──────────────────────────────┘
                    │
         ┌──────────┴──────────┬──────────────┐
         │                     │              │
         ▼                     ▼              ▼
    ┌─────────────┐    ┌────────────┐   ┌─────────┐
    │ API-Football│    │  OpenAI    │   │ Gemini  │
    │  (RapidAPI) │    │   API      │   │  API    │
    │             │    │            │   │         │
    │ - Fixtures  │    │ - gpt-4    │   │- gemini │
    │ - Odds      │    │   turbo    │   │  1.5    │
    │ - Lineups   │    │            │   │         │
    │ - Injuries  │    │ JSON mode  │   │ JSON    │
    └─────────────┘    └────────────┘   └─────────┘
```

## 🔄 Flujo de Datos Detallado

### Step 1: Frontend Submit
```
User Input
  ↓
[Form Validation]
  ↓
setLoading(true)
  ↓
fetch POST /api/analyze {teamA, teamB}
```

### Step 2: Backend Route Handler
```
POST /api/analyze
  ↓
[Validate Input]
  ├─ teamA required?
  └─ teamB required?
  ↓
Call searchMatch(teamA, teamB)
```

### Step 3: Fetch API-Football Data
```
searchMatch()
  ↓
[Call API-Football /fixtures?status=scheduled&next=10]
  ↓
[Filter by team names]
  ↓
Found fixture? ✓
  ↓
Call getMatchDetails(fixtureId)
  ├─ /fixtures?id={id}
  ├─ /odds?fixture={id}
  ├─ /fixtures/lineups?fixture={id}
  └─ /fixtures/injuries?fixture={id}
  ↓
[Parse all responses]
  ├─ parseOdds()
  ├─ parseLineups()
  ├─ parseInjuries()
  ↓
Return MatchData object
```

### Step 4: Time Check
```
getTimeUntilMatch(matchDate, matchTime)
  ↓
Calculate: matchDateTime - now()
  ↓
Convert to hours
  ↓
hoursUntilMatch > 1.5?
  ├─ YES → Return 202 STANDBY
  └─ NO → Continue to Step 5
```

### Step 5: Build Prompt Masterfully
```
buildMasterPrompt(matchData)
  ↓
Inject:
  ├─ League, teams, date/time
  ├─ Current odds
  ├─ Starting lineups (11 vs 11)
  ├─ Injuries data
  └─ Rules of betting analysis
  ↓
Full prompt string ready
```

### Step 6: Call LLM
```
analyzeMatch(matchData)
  ↓
Check: OPENAI_API_KEY? → YES → call analyzeWithOpenAI()
                     → NO  → Check GEMINI_API_KEY? → call analyzeWithGemini()
  ↓
[POST to OpenAI/Gemini API]
  ├─ Model: gpt-4-turbo OR gemini-1.5-pro
  ├─ Temperature: 0.7
  ├─ Max tokens: 2000
  └─ Response format: JSON
  ↓
Parse JSON response
  ↓
Validate estimatedOdds ∈ [2.00, 5.00]
  ├─ YES → Keep value
  └─ NO  → Clamp to 2.5
  ↓
Return BettingAnalysis object
```

### Step 7: Response to Frontend
```
200 OK Response
  ↓
{
  "success": true,
  "data": {
    analysisConfirmed,
    summary,
    riskLevel,
    riskJustification,
    optimalSelection,
    markets[],
    estimatedOdds,
    reasoning,
    matchInfo {}
  }
}
  ↓
Frontend receives
  ├─ setAnalysis(data)
  └─ setLoading(false)
  ↓
Render BettingTicket component
```

## 📁 Estructura de Archivos Detallada

```
betting-analyzer/
│
├── app/
│   ├── api/
│   │   └── analyze/
│   │       ├── route.ts ─────────────────────► Route Handler
│   │       │                                   - POST handler
│   │       │                                   - Orchestration logic
│   │       │                                   - Error handling
│   │       └── (no need for other files in this dir)
│   │
│   ├── page.tsx ───────────────────────────► Main Page
│   │   - Imports MatchSearcher
│   │   - Renders <MatchSearcher />
│   │
│   ├── layout.tsx ──────────────────────────► Root Layout
│   ├── globals.css ────────────────────────► Global Styles
│   └── favicon.ico
│
├── components/
│   └── betting-analyzer.tsx ───────────────► React Components
│       - MatchSearcher
│       - BettingTicket
│       - Client-side logic
│       - Form handling
│       - Rendering results
│
├── lib/
│   ├── types.ts ────────────────────────────► Type Definitions
│   │   - MatchRequest
│   │   - MatchData
│   │   - BettingAnalysis
│   │   - ApiResponse
│   │   - All interfaces
│   │
│   ├── api-football.ts ─────────────────────► Sports Data
│   │   - searchMatch()
│   │   - getMatchDetails()
│   │   - getTimeUntilMatch()
│   │   - parseOdds()
│   │   - parseLineups()
│   │   - parseInjuries()
│   │   - API client config
│   │
│   └── llm-analyzer.ts ─────────────────────► AI Analysis
│       - buildMasterPrompt()
│       - analyzeWithOpenAI()
│       - analyzeWithGemini()
│       - analyzeMatch()
│
├── public/
│   ├── next.svg
│   ├── vercel.svg
│   └── favicon.ico
│
├── .env.local ─────────────────────────────► SECRETS (git ignored)
│   - NEXT_PUBLIC_RAPIDAPI_KEY
│   - OPENAI_API_KEY
│   - GEMINI_API_KEY
│
├── .env.example ───────────────────────────► Template for .env
│
├── next.config.ts ─────────────────────────► Next.js Config
├── tailwind.config.ts ─────────────────────► Tailwind Config
├── tsconfig.json ──────────────────────────► TypeScript Config
├── package.json ───────────────────────────► Dependencies
├── package-lock.json ─────────────────────► Lock File
│
├── README.md ───────────────────────────────► Main Docs
├── COMMANDS.md ─────────────────────────────► Terminal Commands
├── EXAMPLES.md ─────────────────────────────► API Examples
└── ARCHITECTURE.md ────────────────────────► This File
```

## 🔐 Security Considerations

```
.env.local (NEVER COMMIT)
│
├─ NEXT_PUBLIC_RAPIDAPI_KEY
│  └─ Used in: lib/api-football.ts
│     └─ Prefix "NEXT_PUBLIC_" = Exposed to browser (but only for API auth)
│        └─ Consider putting in Route Handler instead if sensitive
│
├─ OPENAI_API_KEY
│  └─ Used in: lib/llm-analyzer.ts
│     └─ Called from Route Handler (server-side only)
│     └─ NEVER expose to browser
│
└─ GEMINI_API_KEY
   └─ Used in: lib/llm-analyzer.ts
      └─ Called from Route Handler (server-side only)
      └─ NEVER expose to browser
```

## 📡 API Integrations

### 1. API-Football (RapidAPI)

```
Base URL: https://api-football-v1.p.rapidapi.com/v3

Headers:
├─ x-rapidapi-key: [NEXT_PUBLIC_RAPIDAPI_KEY]
├─ x-rapidapi-host: api-football-v1.p.rapidapi.com
└─ Accept: application/json

Endpoints Used:
├─ GET /fixtures?status=scheduled&next=10
│  └─ Find upcoming matches
│
├─ GET /fixtures?id={fixtureId}
│  └─ Get detailed fixture info
│
├─ GET /odds?fixture={fixtureId}&bet=1X2,Over/Under,Both Teams Score
│  └─ Get betting odds
│
├─ GET /fixtures/lineups?fixture={fixtureId}
│  └─ Get team lineups
│
└─ GET /fixtures/injuries?fixture={fixtureId}
   └─ Get injury information
```

### 2. OpenAI API

```
Base URL: https://api.openai.com/v1

Auth Header: Authorization: Bearer [OPENAI_API_KEY]

Endpoint Used:
POST /chat/completions

Body:
{
  "model": "gpt-4-turbo",
  "messages": [
    {
      "role": "system",
      "content": "Eres un experto..."
    },
    {
      "role": "user",
      "content": "[FULL PROMPT MAESTRO WITH MATCH DATA]"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 2000,
  "response_format": {"type": "json_object"}
}

Response:
{
  "choices": [
    {
      "message": {
        "content": "{...JSON...}"
      }
    }
  ]
}
```

### 3. Gemini API

```
Base URL: https://generativelanguage.googleapis.com/v1beta/models

Endpoint Used:
POST /{model}:generateContent?key={GEMINI_API_KEY}

Body:
{
  "contents": [
    {
      "role": "user",
      "parts": [{"text": "[FULL PROMPT MAESTRO]"}]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 2000
  }
}

Response:
{
  "candidates": [
    {
      "content": {
        "parts": [
          {"text": "{...JSON...}"}
        ]
      }
    }
  ]
}
```

## ⚡ Performance Optimizations

1. **Caching**
   - Future: Implement Redis cache for recent matches
   - TTL: 30 minutes

2. **Rate Limiting**
   - API-Football: ~100 requests/day (free tier)
   - Implement request queue in production

3. **Parallel Requests**
   - Current: Promise.all([fixtures, odds, lineups, injuries])
   - Reduces latency from ~4 sequential calls

4. **Error Handling**
   - Graceful fallback values for missing data
   - Clear error messages to frontend

## 🧪 Testing Strategy

```
Unit Tests (lib/):
├─ parseOdds()
├─ parseLineups()
├─ parseInjuries()
├─ getTimeUntilMatch()
└─ buildMasterPrompt()

Integration Tests (api/):
├─ POST /api/analyze with valid input
├─ POST /api/analyze with invalid input
├─ POST /api/analyze with standby scenario
└─ Error handling and fallbacks

E2E Tests (ui/):
├─ Form submission
├─ Loading states
├─ Result rendering
└─ Error display
```

---

**Architecture designed for clarity, maintainability, and scalability.** 🏗️
