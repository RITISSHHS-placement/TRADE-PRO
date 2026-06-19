# TradePro — Full-Stack Trading Platform

> Institutional-grade trading platform · Spring Boot + React · Auto-deploys via GitHub

[![Deploy Frontend](https://img.shields.io/badge/Frontend-GitHub%20Pages-blue?logo=github)](https://pages.github.com)
[![Deploy Backend](https://img.shields.io/badge/Backend-Railway-blueviolet?logo=railway)](https://railway.app)

---

## ⚡ One-Command GitHub Setup

```bash
bash setup-github.sh
```

This script will:
1. Initialize git
2. Create your GitHub repo (public or private)
3. Push all code
4. Enable GitHub Pages for the frontend
5. Print the exact secrets you need to add

After running it, your app lives permanently at:
```
https://<your-username>.github.io/<repo-name>/
```
**No domain needed. No hosting bills. Always accessible.**

---

## 🗂 Project Structure

```
tradepro/
├── .github/workflows/deploy.yml  ← CI/CD: auto-deploy on every push
├── backend/                      ← Spring Boot (Java 17)
│   ├── src/main/java/com/tradepro/
│   │   ├── config/               SecurityConfig, CORS
│   │   ├── controller/           Auth, Trade, User REST endpoints
│   │   ├── dto/                  Request/Response objects
│   │   ├── entity/               User, Trade, BoundDevice, UserSession
│   │   ├── exception/            GlobalExceptionHandler
│   │   ├── repository/           Spring Data JPA repos
│   │   ├── security/             JwtAuthenticationFilter
│   │   └── service/              AuthService, JwtService, TradeService
│   ├── src/main/resources/
│   │   ├── application.properties        (dev — H2 in-memory)
│   │   └── application-prod.properties   (prod — PostgreSQL via env vars)
│   ├── Dockerfile
│   ├── railway.toml
│   └── pom.xml
│
├── frontend/                     ← React 18 + Vite
│   ├── src/
│   │   ├── assets/styles/        global.css (design tokens)
│   │   ├── components/
│   │   │   ├── layout/           DashboardLayout, Sidebar
│   │   │   └── ui/               Button, Input, Card, Badge, Toggle
│   │   ├── hooks/                useAuth, useTrades, useKillSwitch
│   │   ├── pages/                Landing, Login, Register, Dashboard,
│   │   │                         Trade, Portfolio, Security, Settings
│   │   ├── services/api.js       Axios client + token refresh interceptor
│   │   ├── store/slices/         authSlice, tradeSlice, uiSlice
│   │   └── App.jsx               React Router with private routes
│   ├── public/
│   │   ├── 404.html              GitHub Pages SPA routing fix
│   │   └── favicon.svg
│   ├── Dockerfile
│   ├── nginx.conf
│   └── vite.config.js            base path support for GitHub Pages
│
├── docker-compose.yml            Local full-stack (Postgres + Backend + Frontend)
├── render.yaml                   One-click Render.com deploy
├── setup-github.sh               ← Run this first!
└── .gitignore
```

---

## 🚀 Step-by-Step Deployment

### STEP 1 — Run setup script

```bash
bash setup-github.sh
```

You'll be asked for your GitHub username and a repo name.  
The script uses the **GitHub CLI** (`gh`). Install it first if needed:

```bash
# macOS
brew install gh

# Windows (winget)
winget install GitHub.cli

# Ubuntu/Debian
sudo apt install gh
```

---

### STEP 2 — Deploy Backend (Railway — free tier)

1. Go to **https://railway.app** → Sign up with GitHub (free)
2. **New Project** → **Deploy from GitHub repo** → select `tradepro`
3. Choose the `backend/` folder as the root
4. Railway detects the Dockerfile automatically
5. Click **Add Plugin** → **PostgreSQL** (free, auto-connected)
6. Under **Variables**, add:

| Variable | Value |
|----------|-------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `JWT_SECRET` | any 64-char random string |
| `CORS_ORIGINS` | `https://<you>.github.io` |
| `TOTP_ISSUER` | `TradePro` |

Railway auto-sets `DATABASE_URL`, `DB_USERNAME`, `DB_PASSWORD` from the plugin.

7. Copy your Railway **public URL** (e.g. `https://tradepro-backend.up.railway.app`)

---

### STEP 3 — Add GitHub Actions Secrets

Go to:  
`https://github.com/<you>/<repo>/settings/secrets/actions`

Add these secrets:

| Secret | Value |
|--------|-------|
| `RAILWAY_TOKEN` | From https://railway.app/account/tokens |
| `VITE_API_URL` | `https://tradepro-backend.up.railway.app/api` |

---

### STEP 4 — Push code → Everything deploys automatically

```bash
git add -A
git commit -m "your message"
git push
```

GitHub Actions will:
- ✅ Build the Spring Boot JAR
- ✅ Build the React app (with your Railway API URL baked in)
- ✅ Deploy frontend to **GitHub Pages**
- ✅ Deploy backend to **Railway**

---

## 🌐 Your URLs (permanent, no domain needed)

| | URL |
|--|-----|
| **Frontend** | `https://<username>.github.io/<repo-name>/` |
| **Backend API** | `https://<project>.up.railway.app/api/` |
| **Health check** | `https://<project>.up.railway.app/api/health` |
| **GitHub Actions** | `https://github.com/<you>/<repo>/actions` |

---

## 💻 Local Development

### Backend only (H2 in-memory DB, no setup needed)
```bash
cd backend
mvn spring-boot:run
# → http://localhost:8080
# → http://localhost:8080/h2-console  (DB browser)
```

### Frontend only
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
# Vite proxies /api → localhost:8080 automatically
```

### Full stack with Docker
```bash
docker-compose up --build
# Frontend → http://localhost:3000
# Backend  → http://localhost:8080
# Postgres → localhost:5432
```

---

## 🔑 API Reference

### Public Endpoints (no token)
```
POST /api/auth/register      Register new user
POST /api/auth/login         Login → returns JWT
POST /api/auth/refresh       Refresh access token
GET  /api/health             Health check
```

### Protected Endpoints (Bearer token required)
```
POST   /api/auth/logout              Invalidate session
POST   /api/auth/setup-totp          Generate TOTP QR
POST   /api/auth/verify-totp         Confirm TOTP code

GET    /api/users/profile            Get current user
POST   /api/users/{id}/kill-switch   Halt all trading
PUT    /api/users/{id}/risk-profile  Update risk level
PUT    /api/users/{id}/auto-logout   Set inactivity timer
PUT    /api/users/{id}/nudges        Toggle AI nudges

POST   /api/trades/place/{userId}    Place order
GET    /api/trades/user/{userId}     Trade history
GET    /api/trades/positions/{id}    Open positions
DELETE /api/trades/{id}/cancel/{uid} Cancel order
GET    /api/trades/pnl/{userId}      Total P&L
```

---

## 🔒 Security Stack

| Feature | Implementation |
|---------|---------------|
| Password hashing | BCrypt (adaptive cost) |
| Access tokens | JWT HS256, 24h expiry |
| Refresh tokens | JWT, 7-day rotation |
| 2FA | TOTP (RFC 6238) via Google Auth |
| Device binding | New devices require email/SMS |
| Kill switch | Halts trading + revokes all sessions |
| Auto-logout | Configurable 15m–2h inactivity |
| CORS | Whitelist via env var |
| Session mgmt | UserSession entity, active/inactive |

---

## 🛠 Tech Stack

| | |
|--|--|
| **Backend** | Spring Boot 3.2, Spring Security, JPA |
| **Auth** | jjwt 0.12, BCrypt, GoogleAuth TOTP |
| **Database** | H2 (dev) / PostgreSQL (prod) |
| **Frontend** | React 18, Vite, Redux Toolkit |
| **Charts** | Recharts |
| **Styles** | CSS Modules + design tokens |
| **Deploy** | GitHub Pages (frontend) + Railway (backend) |
| **CI/CD** | GitHub Actions |

---

## ❓ FAQ

**Q: Will GitHub Pages always be accessible?**  
A: Yes. GitHub Pages is free and permanent as long as your repo exists. The URL never changes.

**Q: Does Railway stay free?**  
A: Railway's free tier gives $5/month credit which covers a small backend. For production, upgrade or switch to Render (also has a free tier via `render.yaml`).

**Q: How do I update the app?**  
A: Just `git push`. GitHub Actions handles the rest automatically.

**Q: Can I use a custom domain?**  
A: Yes — in your repo Settings → Pages → Custom domain. But the default `github.io` URL always works too.
