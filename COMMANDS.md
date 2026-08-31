# 📋 Comandos Iniciales del Proyecto

## 1️⃣ Crear el Proyecto Next.js

El proyecto ya fue creado con los comandos siguientes:

```bash
# Crear proyecto (ya hecho)
npm create next-app@latest betting-analyzer \
  --typescript \
  --tailwind \
  --app \
  --no-git \
  --no-src-dir \
  --import-alias '@/*'
```

## 2️⃣ Instalar Dependencias Adicionales

```bash
# Entrar en el directorio
cd C:\Users\Diego\betting-analyzer

# Instalar axios y dotenv
npm install axios dotenv
```

## 3️⃣ Ejecutar en Desarrollo

```bash
# Desde el directorio del proyecto
npm run dev

# Verás algo como:
# ▲ Next.js 15.0.3
# - Local:        http://localhost:3000
```

## 4️⃣ Build para Producción

```bash
# Compilar la aplicación
npm run build

# Iniciar el servidor de producción
npm start
```

## 5️⃣ Linting (Opcional)

```bash
# Ejecutar ESLint
npm run lint
```

## 🧪 Testing de la API

### Opción 1: Con cURL

```bash
# En PowerShell
curl -X POST http://localhost:3000/api/analyze `
  -H "Content-Type: application/json" `
  -d '{\"teamA\": \"Roma\", \"teamB\": \"Lecce\"}'
```

### Opción 2: Con Postman
1. Crear nueva request
2. Tipo: POST
3. URL: `http://localhost:3000/api/analyze`
4. Body (JSON):
```json
{
  "teamA": "Roma",
  "teamB": "Lecce"
}
```

### Opción 3: Con VS Code REST Client
Crear archivo `test.http`:
```http
### Test Endpoint
POST http://localhost:3000/api/analyze
Content-Type: application/json

{
  "teamA": "Roma",
  "teamB": "Lecce"
}
```

Luego hacer clic en "Send Request"

## 📦 Estructura de Archivos Creados

### Librerías (TypeScript)
```
lib/
├── types.ts              ← Tipos compartidos
├── api-football.ts       ← Integración con API deportiva
└── llm-analyzer.ts       ← Integración con LLM (OpenAI/Gemini)
```

### Componentes React
```
components/
└── betting-analyzer.tsx  ← UI (MatchSearcher + BettingTicket)
```

### API Routes
```
app/api/analyze/
└── route.ts             ← Endpoint POST /api/analyze
```

### Configuración
```
.env.local               ← Variables de entorno (GIT IGNORED)
```

## ⚡ Atajos Útiles

### Abrir en VS Code
```bash
code .
```

### Limpiar node_modules (si hay conflictos)
```bash
rm -r node_modules
npm install
```

### Logs del Servidor
```bash
# El servidor muestra logs en la terminal donde ejecutas "npm run dev"
# Busca [HMR] para actualizaciones en caliente
# Busca [TypeError] para errores
```

## 🔐 Variables de Entorno Requeridas

Edita `C:\Users\Diego\betting-analyzer\.env.local`:

```env
# API-Football
NEXT_PUBLIC_RAPIDAPI_KEY=your_key_from_rapidapi
NEXT_PUBLIC_RAPIDAPI_HOST=api-football-v1.p.rapidapi.com

# LLM - OpenAI
OPENAI_API_KEY=your_key_from_openai
OPENAI_MODEL=gpt-4-turbo

# O LLM - Gemini (alternativa)
# GEMINI_API_KEY=your_key_from_google
# GEMINI_MODEL=gemini-1.5-pro
```

## 🚀 Despliegue en Vercel

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login en Vercel
vercel login

# 3. Desplegar (desde carpeta del proyecto)
vercel

# 4. Seguir las instrucciones interactivas

# 5. Después, agregar variables de entorno en Vercel Dashboard
#    Project Settings > Environment Variables
```

## 📊 Monitoreo del Servidor

```bash
# Ver todos los procesos Node
Get-Process node

# Terminar un proceso Node (si se congela)
Stop-Process -Name "node" -Force

# Reiniciar el servidor de desarrollo
# Presiona Ctrl+C en la terminal
# Luego ejecuta: npm run dev
```

## 🐛 Debugging

### Habilitar Debug Logging
```bash
# En PowerShell
$env:DEBUG = "nextjs:*"
npm run dev
```

### Chrome DevTools
1. Abrir http://localhost:3000
2. F12 → Network → Ver requests a `/api/analyze`
3. Ver Response JSON

## ✅ Checklist de Configuración

- [ ] Proyecto Next.js creado
- [ ] Dependencias instaladas (axios, dotenv)
- [ ] `.env.local` configurado con API keys
- [ ] `lib/types.ts` creado
- [ ] `lib/api-football.ts` creado
- [ ] `lib/llm-analyzer.ts` creado
- [ ] `app/api/analyze/route.ts` creado
- [ ] `components/betting-analyzer.tsx` creado
- [ ] `app/page.tsx` actualizado
- [ ] `README.md` actualizado
- [ ] Servidor ejecutándose con `npm run dev`
- [ ] Página carga en http://localhost:3000

## 📞 Support

Si hay errores:
1. Revisa la terminal de `npm run dev` para error messages
2. Abre Chrome DevTools (F12) para ver logs del frontend
3. Verifica que `.env.local` tenga las claves correctas
4. Reinicia el servidor con Ctrl+C + `npm run dev`

---

**¡Listo! La aplicación está lista para usar.** 🎉
