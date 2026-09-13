# TradePro Architecture Audit

## Existing architecture

### Frontend
- React 18 + Vite single-page application.
- Redux Toolkit for auth/trade/market state.
- Axios API client in `frontend/src/services/api.js`.
- Stores access token in `localStorage` and sends it via `Authorization` header.
- Uses `withCredentials: true` for cookies, but token persistence is mixed.
- Market data fetched from backend HTTP proxy endpoints.
- No WebSocket support in current UI.
- Order placement and portfolio views are implemented with HTTP REST calls.

### Backend
- Spring Boot 3.2 monolithic REST API.
- Controllers:
  - `AuthController`
  - `TradeController`
  - `UserController`
  - `MarketDataController`
  - `PaymentController`
  - `TestController`
- Services:
  - `AuthService`
  - `JwtService`
  - `OtpService`
  - `TradeService`
  - `UserService`
  - `PaymentService`
- Security config in `SecurityConfig`.
- Custom filters:
  - `JwtAuthenticationFilter`
  - `RateLimitFilter`
- Redis config exists, but usage is limited to rate limiting.
- Mail config and OTP service implemented with Spring Mail and retry.
- Current database config supports:
  - H2 for local/dev
  - PostgreSQL in production via env vars
  - Fallback to in-memory H2 when database connection unavailable.

### Database
- JPA entities:
  - `User`
  - `Trade`
  - `BoundDevice`
  - `UserSession`
  - `EmailOtp`
  - `GttCondition`
- No migration framework (Flyway/Liquibase) present.
- Hibernate `ddl-auto=update` in both dev and prod profiles.
- No explicit indexes or schema versioning.

### Cache
- Redis is configured in `RedisConfig` using Lettuce.
- Active Redis usage appears only in `RateLimitFilter`.
- `OtpService` still relies on JVM-local in-memory rate limiting.
- `MarketDataController` uses an in-process `ConcurrentHashMap` cache.

### Authentication
- Passwords hashed using BCrypt (`BCryptPasswordEncoder` strength 12).
- JWT access tokens and refresh tokens are generated with HS256.
- `AuthService` stores session records in `UserSession`.
- Refresh flow accepts token from request body or cookie.
- TOTP setup and verification exist using `GoogleAuthenticator`.
- Email OTP exists with hashed OTP storage and email delivery.
- Device binding is present but auto-trusts new devices.
- No explicit device-specific session revocation endpoint beyond logout.

### Trading
- `TradeController` exposes endpoints for placing, cancelling and listing trades.
- `TradeService` stores trades and auto-completes market orders.
- No formal order lifecycle or state machine.
- No dedicated order entity separate from `Trade`.
- No position, portfolio, margin, balance, ledger, or risk engine.
- `Trade.OrderType` supports `MARKET`, `LIMIT`, `STOP_LOSS`, `STOP_LOSS_MARKET`.
- `Trade.Segment` supports `EQUITY`, `FUTURES`, `OPTIONS`, `CURRENCY`, `COMMODITY`.
- P&L is a simple SUM of completed trade `pnl` values.

### Market data
- Backend proxy controller fetches NSE API endpoints using `RestTemplate`.
- Caches responses in JVM memory with simple expiry.
- Frontend uses HTTP fetching from `/api/market` endpoints.
- No streaming or push-based market data.

### Deployment
- Backend Dockerfile builds Spring Boot JAR.
- Frontend Dockerfile builds static assets and serves via Nginx.
- `docker-compose.yml` defines Postgres, backend, frontend for local stack.
- `render.yaml` suggests Render deployment of backend and database.
- README refers to GitHub Actions and Railway, but `.github/workflows` is absent.

## Current problems

### Security
- JWT uses HS256 with environment-secret fallback; secret key handling is weak.
- Refresh token and access token handling is inconsistent across cookies and localStorage.
- Access token is stored in localStorage, exposing it to XSS risk.
- TOTP secret is stored directly in `User.totpSecret` without explicit encryption.
- OTP delivery logs OTP values to console.
- Email OTP rate limits are JVM-local; not distributed.
- CORS and CSP are present but origin list is hardcoded and broad.
- CSRF is disabled entirely.

### Scalability
- Critical state resides in local JVM memory: caching and OTP rate limiting.
- JWT refresh session state is stored only in DB but not protected from replay.
- No shared state for sessions, idempotency, or locks across instances.
- Market data cache is local to each backend instance.
- No message queue or worker layer for asynchronous processing.

### Availability
- No health/readiness endpoints beyond managed actuator config.
- No automated recovery for Redis/DB failure.
- Redis connection is lazy and optional; fallback allows degraded behavior.
- No explicit high-availability architecture.

### Database
- `hibernate.ddl-auto=update` in prod is unsafe for production schema management.
- No versioned migrations.
- No audit ledger or immutable financial history.
- No schema for balances, positions, orders, ledgers.
- Database connectivity uses environment parsing logic and falls back to H2, which is dangerous in prod.

### Authentication
- Refresh tokens are not rotated securely.
- Sessions are not tracked with device/session metadata in a robust way.
- Logout clears cookies but does not invalidate all possible refresh references globally.
- Device binding is permissive.
- No bot protection or brute-force mitigation beyond the simple rate limiter.

### Trading
- Order processing is simplistic and not broker-aware.
- No risk checks, no margin calculation, and no position management.
- No idempotency for order placement.
- Market orders are immediately marked complete with no execution engine.
- No event-driven order lifecycle or trade execution pipeline.

### Real-time
- No WebSocket or push update architecture.
- Market data and orders depend on HTTP polling.
- Frontend reconnection logic is absent.

### Observability
- No metrics, tracing, or alerting frameworks present.
- Logging is basic and not correlated with request IDs.
- No request correlation or distributed tracing.

### Deployment
- CI/CD configuration is missing or incomplete in the repository.
- No developer/test environment defined for Redis, queue, or Postgres beyond `docker-compose`.
- No disaster recovery or backup plan documented.

## Target architecture

### Overview

```mermaid
flowchart TD
    USER[User Browser] --> CDN[CDN / Static Assets]
    CDN --> WAF[WAF / Bot Protection]
    WAF --> LB[Load Balancer]
    LB --> API1[Backend API Instance A]
    LB --> API2[Backend API Instance B]
    LB --> API3[Backend API Instance C]

    API1 --> REDIS[Redis Cluster]
    API2 --> REDIS
    API3 --> REDIS

    API1 --> POSTGRES[PostgreSQL Primary]
    API2 --> POSTGRES
    API3 --> POSTGRES

    API1 --> QUEUE[Message Queue (Kafka/RabbitMQ)]
    API2 --> QUEUE
    API3 --> QUEUE

    QUEUE --> WORKERS[Worker / Simulator / OTP Processor]
    WORKERS --> REDIS
    WORKERS --> POSTGRES

    API1 --> BROKER[BrokerGateway / Simulator]
    API2 --> BROKER
    API3 --> BROKER

    API1 --> WS[WebSocket Service]
    API2 --> WS
    API3 --> WS

    REDIS --> WS
    WS --> USER
```

### Authentication architecture
- User credentials hashed with Argon2id / BCrypt.
- Access tokens signed with RS256/ES256.
- Short-lived access token in memory.
- Rotating refresh token in secure HttpOnly `SameSite` cookies.
- Refresh token metadata stored in Redis/Postgres.
- OTP and TOTP secrets handled by secure provider abstraction.
- Email OTP generated, hashed, persisted, and delivered through provider abstraction.

### Order architecture
- Order submission enters `OrderService`.
- `OrderValidator` validates product, market, quantity, margins.
- `RiskEngine` reserves margin and validates account state.
- `OrderStateMachine` drives states `NEW → VALIDATING → RISK_CHECK → ACCEPTED → SUBMITTED → OPEN → PARTIAL_FILLED → FILLED`.
- Order data persists as append-only records.
- Idempotency keys enforced via DB unique index + Redis guard.
- `BrokerGateway` abstracts execution; `SimulatorGateway` implements simulated execution.

### Market-data architecture
- `MarketDataProvider` interface.
- `MarketDataService` caches quotes in Redis.
- `MarketDataSimulator` provides development feed.
- Backend pushes updates to WebSocket channels.
- Frontend subscribes to market and private channels.

### WebSocket architecture
- Secure `/ws/market` public channel.
- Secure `/ws/private` authenticated channel.
- Private channel authorized per user.
- Reconnect flow with auth, resubscribe, state reconciliation.

### Failure handling
- Requests include `X-Request-ID`.
- API retries queue work and dead-letter failed events.
- Redis failures degrade gracefully but prevent write-critical state.
- DB failures return safe errors.
- Mail provider failures captured by retry/circuit-breaker.

### Scaling strategy
- Stateless backend instances.
- Redis for distributed locks, sessions, rate limits, OTP state.
- Postgres primary/replica or managed service.
- Queue for async work.
- WebSockets backed by shared Redis pub/sub.
- Frontend static assets on CDN.

### Disaster recovery
- Postgres backups + PITR.
- Redis persistence or managed service snapshots.
- Secondary region deployment plan.
- documented RPO/RTO.
