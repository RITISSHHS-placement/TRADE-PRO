# 🛡️ Keep-Alive Monitoring Setup

Your backend on Render free tier sleeps after 15 minutes of inactivity. Here's a **triple-redundancy** system to prevent cold starts:

## Layer 1: Frontend Keep-Alive (Already Active) ✅

The frontend already pings `/api/health` every 8 minutes when any user has the app open. This works when users are online.

## Layer 2: UptimeRobot (External Monitor) — Manual Setup

**UptimeRobot** pings your backend every 5 minutes from external servers, 24/7 — even when no users are online.

### Setup (2 minutes, free, no credit card)

1. **Go to [uptimerobot.com](https://uptimerobot.com)** → Sign up free
2. Click **"+ Add New Monitor"** (top right)
3. Fill in:
   - **Monitor Type:** `HTTP(S)`
   - **Friendly Name:** `TradePro Backend`
   - **URL (or IP):** `https://tradepro-backend-erfj.onrender.com/api/health`
   - **Monitoring Interval:** `5 minutes`
4. Click **"Create Monitor"**

That's it. UptimeRobot will ping your backend every 5 minutes, keeping Render's free tier from sleeping.

### Why `/api/health`?

- `/health` and `/health/ping` may return 403 (security config needs deployment)
- `/api/health` returns 200 with `{"status":"UP"}` — it's the reliable endpoint

## Layer 3: cron-job.org (Backup External Cron) — Manual Setup

**cron-job.org** is a free cron service that fires HTTP requests on schedule. Use this as a backup to UptimeRobot.

### Setup (3 minutes, free, no credit card)

1. **Go to [cron-job.org](https://cron-job.org)** → Sign up free
2. Click **"Create new cronjob"**
3. Fill in:
   - **Title:** `TradePro Keep-Alive`
   - **URL:** `https://tradepro-backend-erfj.onrender.com/api/health`
   - **Request Method:** `GET`
   - **Schedule:** Every `8` minutes
4. Click **"Save"**
5. Toggle the cronjob to **Active**

## How It All Works Together

```
┌─────────────────────────────────────────────────┐
│              Render Free Tier Backend            │
│         (sleeps after 15 min of inactivity)      │
└─────────────┬───────────────────┬───────────────┘
              │                   │
   ┌──────────▼──────┐  ┌────────▼─────────┐
   │  Frontend App   │  │  External Servers │
   │  (keepAlive.js) │  │                   │
   │                 │  │  UptimeRobot      │
   │  Pings every    │  │  Pings every 5min │
   │  8 minutes      │  │                   │
   │  (when users    │  │  cron-job.org     │
   │   are online)   │  │  Pings every 8min │
   └─────────────────┘  └───────────────────┘
              │                   │
              └─────────┬─────────┘
                        ▼
              ┌──────────────────┐
              │   /api/health    │
              │   Returns 200 OK │
              │   Server stays   │
              │   alive! ✅      │
              └──────────────────┘
```

### Why Triple Redundancy?

| Scenario | Layer 1 | Layer 2 | Layer 3 | Server Status |
|----------|---------|---------|---------|---------------|
| Users online | ✅ Frontend pings | ✅ UptimeRobot | ✅ cron-job.org | ✅ Awake |
| No users, UptimeRobot active | ❌ | ✅ | ✅ | ✅ Awake |
| No users, cron-job.org active | ❌ | ✅ | ✅ | ✅ Awake |
| All external down (rare) | ❌ | ❌ | ❌ | ❌ Cold start (20-60s) |

### Cost

- **UptimeRobot Free:** 50 monitors, 5-min intervals — more than enough
- **cron-job.org Free:** Unlimited cronjobs, minimum 1-minute intervals
- **Total cost:** $0

## Cold Start vs Always-On

Even with all three layers, a cold start **can** happen if:
- All three systems have a bad moment simultaneously (very rare)
- Render deploys a new version (triggers restart)
- Render has infrastructure issues

If cold starts still bother you, the **only** permanent solution is:
- **Render Starter plan ($7/mo):** Always-on, no sleeping
- **Railway ($5/mo):** No sleeping on free tier with $5 credits
- **Fly.io (free):** 3 shared-cpu-1x VMs, no sleeping

## Verifying Your Setup

After setting up UptimeRobot and cron-job.org:

1. Wait 30 minutes (ensure pings are happening)
2. Open your app — you should NOT see "Server is starting up"
3. Check UptimeRobot dashboard — should show "Up" with response times
4. Check cron-job.org dashboard — should show successful runs
