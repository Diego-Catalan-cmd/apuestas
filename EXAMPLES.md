# 📝 Ejemplos de Uso de la API

## 🎯 Casos de Uso

### Caso 1: Partido Próximo (Análisis Disponible)
El usuario busca un partido que comienza en 45 minutos.

**Request:**
```json
{
  "teamA": "Roma",
  "teamB": "Lecce"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "analysisConfirmed": true,
    "summary": "Roma con bajas críticas en defensa. Lecce llega motivado tras victoria anterior.",
    "riskLevel": "Medio",
    "riskJustification": "Roma sin su central titular, pero juega en casa. Lecce sin presión por descenso.",
    "optimalSelection": "Ambos Equipos Anotan: Sí + Más de 2.5 Goles",
    "markets": [
      {
        "market": "Ambos Equipos Anotan",
        "selection": "Sí",
        "odds": 1.80
      },
      {
        "market": "Más de 2.5 Goles",
        "selection": "Sí",
        "odds": 1.65
      }
    ],
    "estimatedOdds": 2.97,
    "reasoning": "Roma tiene goleadores letales pero defensa débil. Lecce juega con libertad tras victoria. Esperamos goles de ambos lados. Combinación de mercados proporciona cuota de 2.97 (dentro del rango 2.00-5.00).",
    "matchInfo": {
      "teamA": "Roma",
      "teamB": "Lecce",
      "league": "Serie A",
      "date": "2024-08-31",
      "time": "18:00:00"
    }
  }
}
```

### Caso 2: Partido Lejano (Standby)
El usuario busca un partido que comienza en 3 horas.

**Request:**
```json
{
  "teamA": "Manchester United",
  "teamB": "Liverpool"
}
```

**Response (202 Accepted - Standby):**
```json
{
  "success": false,
  "error": "🟡 STANDBY - El partido queda en standby. Faltan 3.2 horas. Espera 45 minutos antes del partido cuando salgan las alineaciones oficiales."
}
```

### Caso 3: Partido No Encontrado
El usuario busca equipos que no tienen partido próximo.

**Request:**
```json
{
  "teamA": "Equipo Inexistente",
  "teamB": "Otro Inexistente"
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "No se encontró el partido entre Equipo Inexistente y Otro Inexistente"
}
```

### Caso 4: Request Inválido
Faltan parámetros.

**Request:**
```json
{
  "teamA": "Roma"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Se requieren nombres de ambos equipos (teamA, teamB)"
}
```

### Caso 5: Error de API
Problema con la API deportiva o LLM.

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Error procesando análisis: Failed to search match"
}
```

## 🔍 Detalles de Mercados

La API respeta estrictamente estos mercados:

### ✅ Permitidos

1. **Goles**
   - Más de 0.5 goles
   - Más de 1.5 goles
   - Más de 2.5 goles
   - Más de 3.5 goles

2. **Ambos Equipos Anotan**
   - Sí / No

3. **Córners**
   - Más de X córners (totales)
   - Más de X córners (equipo específico)

4. **Doble Oportunidad**
   - 1X (victoria local o empate)
   - X2 (empate o victoria visitante)
   - 12 (victoria de cualquiera)

5. **Tiros**
   - Más de X tiros (totales)
   - Más de X tiros (equipo específico)

### ❌ Prohibidos

- ❌ Hándicap Asiático
- ❌ Goles exactos
- ❌ Estadísticas de jugadores individuales
- ❌ Menos de X goles
- ❌ Combinaciones contradictoras

Ejemplo de **combinación prohibida**:
```json
{
  "market": "Combinación Inválida",
  "selection": "Doble Oportunidad 1X + Ambos Equipos Anotan NO",
  "issue": "Si es 1X, el empate 0-0 es posible, pero AEA NO lo descarta"
}
```

## 📊 Ejemplo Completo: Análisis Detallado

```json
{
  "success": true,
  "data": {
    "analysisConfirmed": true,
    "summary": "Juventus vs Napoli. Juventus: Mbappé (lesión muscular) baja. Napoli: Neres (suspensión) ausente. Juventus con racha de 3 victorias, Napoli con 2 empates.",
    "riskLevel": "Medio",
    "riskJustification": "Juventus tiene baja importante pero juega en casa. Napoli sin suspensión no altera mucho. La liga está competitiva.",
    "optimalSelection": "Juventus Gana O Ambos Anotan + Más de 1.5 Goles",
    "markets": [
      {
        "market": "Doble Oportunidad",
        "selection": "Juventus gana o Empate (1X)",
        "odds": 1.53
      },
      {
        "market": "Ambos Equipos Anotan",
        "selection": "Sí",
        "odds": 1.60
      },
      {
        "market": "Goles",
        "selection": "Más de 1.5",
        "odds": 1.38
      }
    ],
    "estimatedOdds": 3.38,
    "reasoning": "FASE 1 - Auditoría: Juventus sin Mbappé (no es central titular, es delantero, no críticopara defensa). Napoli sin Neres no impacta ofensiva crítica. Juventus favorita local. FASE 2 - Construcción: Combinamos 1X (casa favorece) + AEA Sí (ambas ofensivas activas) + Más 1.5 goles (esperamos movimiento ofensivo). Evitamos apostar solo a victoria directa por baja de ofensiva. FASE 3 - Cuota: 1.53 × 1.60 × 1.38 = 3.38 (dentro de 2.00-5.00).",
    "matchInfo": {
      "teamA": "Juventus",
      "teamB": "Napoli",
      "league": "Serie A",
      "date": "2024-09-02",
      "time": "20:45:00"
    }
  }
}
```

## 🧪 Script de Prueba (Node.js)

```javascript
// test-api.js
const fetch = require('node-fetch');

async function testAPI() {
  const testCases = [
    { teamA: "Roma", teamB: "Lecce" },
    { teamA: "Manchester United", teamB: "Liverpool" },
    { teamA: "Fake Team", teamB: "Otro Fake" },
  ];

  for (const testCase of testCases) {
    console.log(`\n📊 Testing: ${testCase.teamA} vs ${testCase.teamB}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase),
      });
      
      const data = await response.json();
      console.log(`Status: ${response.status}`);
      console.log(`Response:`, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
}

testAPI();
```

Ejecutar:
```bash
npm install node-fetch
node test-api.js
```

## 📱 Consumir en Frontend (React)

```typescript
import { useState } from 'react';

export function AnalyzerForm() {
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamA, teamB }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.data);
      } else {
        alert(`Error: ${data.error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Team A"
          value={teamA}
          onChange={(e) => setTeamA(e.target.value)}
        />
        <input
          type="text"
          placeholder="Team B"
          value={teamB}
          onChange={(e) => setTeamB(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>

      {analysis && (
        <div>
          <h2>Analysis for {analysis.matchInfo.teamA} vs {analysis.matchInfo.teamB}</h2>
          <p>Cuota: {analysis.estimatedOdds}</p>
          <p>Risk: {analysis.riskLevel}</p>
        </div>
      )}
    </>
  );
}
```

---

**Nota:** Todos los ejemplos usan datos ficticios para propósitos ilustrativos.
