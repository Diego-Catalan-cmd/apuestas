# ⚡ Quick Reference

## 📍 Ubicación del Proyecto
```
C:\Users\Diego\betting-analyzer
```

## 🚀 Iniciar Desarrollo

```bash
cd C:\Users\Diego\betting-analyzer
npm run dev
# Acceder a http://localhost:3000
```

## 🔑 Configuración Requerida

Editar `C:\Users\Diego\betting-analyzer\.env.local`:

```env
NEXT_PUBLIC_RAPIDAPI_KEY=your_key
NEXT_PUBLIC_RAPIDAPI_HOST=api-football-v1.p.rapidapi.com
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4-turbo
```

## 📁 Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `app/api/analyze/route.ts` | Endpoint principal |
| `lib/api-football.ts` | Integración deportiva |
| `lib/llm-analyzer.ts` | Integración IA |
| `components/betting-analyzer.tsx` | UI React |
| `lib/types.ts` | Tipos TypeScript |

## 🧪 Test API Rápido

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"teamA":"Roma","teamB":"Lecce"}'
```

## 📊 Respuesta Esperada

```json
{
  "success": true,
  "data": {
    "analysisConfirmed": true,
    "riskLevel": "Medio",
    "estimatedOdds": 2.45,
    "markets": [...]
  }
}
```

## 🐛 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| "No se encontró el partido" | Partido no existe o no hay en próximas 24h |
| 🟡 STANDBY | Partido comienza en >1.5h, espera 45 min |
| API Key error | Revisa .env.local |
| CORS error | Reinicia el servidor |

## 📚 Documentación

- `README.md` - Overview completo
- `COMMANDS.md` - Comandos terminal
- `EXAMPLES.md` - Ejemplos API
- `ARCHITECTURE.md` - Diagrama técnico

## 🎯 Flujo de Uso

```
1. Usuario ingresa: "Roma vs Lecce"
   ↓
2. Frontend envía POST /api/analyze
   ↓
3. Backend consulta API-Football
   ↓
4. Backend consulta OpenAI/Gemini
   ↓
5. Frontend recibe JSON estructurado
   ↓
6. Se renderiza BettingTicket
```

## 🔧 Stack Resumen

- **Frontend:** React 19 + Tailwind CSS
- **Backend:** Next.js 15 App Router
- **APIs:** OpenAI, Gemini, API-Football
- **Language:** TypeScript

## 📦 Instalar Dependencias (si falta)

```bash
npm install
# O específicamente:
npm install axios dotenv
```

## 💾 Guardar Cambios

```bash
# Git (si lo usas)
git add .
git commit -m "Update betting analyzer"
git push
```

## 🚀 Deploy Vercel

```bash
vercel
# Sigue las instrucciones
# Agrega env vars en dashboard
```

## 📞 Debugging Rápido

Abre `http://localhost:3000` y presiona `F12` para DevTools

```javascript
// En console
fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ teamA: 'Roma', teamB: 'Lecce' })
})
.then(r => r.json())
.then(d => console.log(d))
```

## ✅ Checklist Pre-Launch

- [ ] `.env.local` configurado
- [ ] `npm run dev` funciona
- [ ] Frontend carga en localhost:3000
- [ ] Test API devuelve JSON válido
- [ ] BettingTicket se renderiza
- [ ] No hay errores en console (F12)

---

**¡Listo para usar!** 🎉
