# 🎫 Betting Analyzer - MVP

Una aplicación web moderna que analiza partidos de fútbol usando IA para generar recomendaciones de apuestas de alto valor (2.00 - 5.00 en cuotas).

## 🏗️ Estructura del Proyecto

```
betting-analyzer/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts          # Route Handler principal - orquesta todo
│   ├── page.tsx                  # Página principal
│   ├── layout.tsx
│   └── globals.css
├── components/
│   └── betting-analyzer.tsx      # Componentes React (Buscador + Ticket)
├── lib/
│   ├── types.ts                  # Tipos TypeScript
│   ├── api-football.ts           # Integración con API-Football
│   └── llm-analyzer.ts           # Integración con OpenAI/Gemini
├── .env.local                    # Variables de entorno (NO COMMITTEAR)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 🚀 Quick Start

### 1. Instalación

```bash
# Clonar o descargar el proyecto
cd betting-analyzer

# Las dependencias ya están instaladas, pero si las necesitas:
npm install
```

### 2. Configuración de Variables de Entorno

Edita `.env.local` con tus claves API:

```env
# API-Football (https://rapidapi.com/api-sports/api/api-football)
NEXT_PUBLIC_RAPIDAPI_KEY=your_key_here
NEXT_PUBLIC_RAPIDAPI_HOST=api-football-v1.p.rapidapi.com

# OpenAI (https://openai.com/api)
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4-turbo

# O Gemini (https://ai.google.dev)
# GEMINI_API_KEY=your_key_here
# GEMINI_MODEL=gemini-1.5-pro
```

### 3. Ejecutar el Servidor de Desarrollo

```bash
npm run dev
```

Accede a `http://localhost:3000`

## 📡 Flujo de la Aplicación

### Frontend
1. Usuario ingresa dos equipos (ej: "Roma" y "Lecce")
2. Estado "Cargando..." mientras se procesa
3. Recibe el JSON estructurado de la IA

### Backend (Route Handler `/api/analyze`)

**Paso 1: Recibir Solicitud**
```
POST /api/analyze
{
  "teamA": "Roma",
  "teamB": "Lecce"
}
```

**Paso 2: Consultar API Deportiva (API-Football)**
- Búsqueda de fixture por nombres de equipos
- Obtener: fecha/hora, alineaciones, lesionados, cuotas

**Paso 3: Verificar Tiempo al Partido**
- Si faltan >1.5 horas → 🟡 STANDBY
- Si faltan ≤1.5 horas → Proceder con análisis

**Paso 4: Inyectar en Prompt Maestro**
- Datos reales del partido
- Alineaciones confirmadas
- Lesionados/bajas
- Cuotas actuales

**Paso 5: Llamar a LLM (OpenAI o Gemini)**
- El IA aplica las reglas del Prompt Maestro
- Retorna JSON estructurado

**Paso 6: Responder al Frontend**

## 🔑 APIs Requeridas

### 1. API-Football (RapidAPI)
- **URL:** https://rapidapi.com/api-sports/api/api-football
- **Endpoints necesarios:**
  - `/fixtures` - Buscar partidos
  - `/odds` - Obtener cuotas
  - `/fixtures/lineups` - Alineaciones
  - `/fixtures/injuries` - Lesionados

### 2. OpenAI (o Gemini)
- **OpenAI:** https://openai.com/api
- **Gemini:** https://ai.google.dev

## 🧪 Testing Local

### Test con cURL
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"teamA": "Roma", "teamB": "Lecce"}'
```

## 🚀 Despliegue

### Vercel (Recomendado)
```bash
# 1. Push a GitHub
git push origin main

# 2. Conectar en Vercel
# https://vercel.com/new

# 3. Añadir variables de entorno en Settings
```

## ⚠️ Notas Importantes

1. **Clave API**: Requeridas para acceder a datos deportivos reales
2. **Standby Logic**: Los partidos se analizan solo 45 minutos antes
3. **Disclaimer**: Herramienta educativa. No constituye asesoramiento financiero
4. **Rate Limit**: API-Football tiene límites de llamadas

---

**Hecho con ⚽ y IA para análisis responsable.**
