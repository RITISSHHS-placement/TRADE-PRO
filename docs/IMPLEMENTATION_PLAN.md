# TradePro Implementation Plan

## Overview
This implementation plan transforms TradePro from a prototype into a production-grade brokerage/trading platform. It preserves existing UI while adding secure authentication, distributed state, trading architecture, observability, and infrastructure hardening.

---

## PHASE 1 — Authentication hardening

### Goals
- Harden registration/login.
- Add JWT + refresh token architecture.
- Add OTP and TOTP abstractions.
- Add session/device management.
- Add rate limiting and security audit logs.

### Files to modify
- `backend/src/main/java/com/tradepro/config/SecurityConfig.java`
- `backend/src/main/java/com/tradepro/controller/AuthController.java`
- `backend/src/main/java/com/tradepro/service/AuthService.java`
- `backend/src/main/java/com/tradepro/service/JwtService.java`
- `backend/src/main/java/com/tradepro/service/OtpService.java`
- `backend/src/main/java/com/tradepro/entity/User.java`
- `backend/src/main/java/com/tradepro/entity/UserSession.java`
- `backend/src/main/java/com/tradepro/entity/BoundDevice.java`
- `backend/src/main/java/com/tradepro/repository/UserSessionRepository.java`
- `backend/src/main/java/com/tradepro/repository/BoundDeviceRepository.java`
- `backend/src/main/java/com/tradepro/dto/AuthResponse.java`
- `backend/src/main/java/com/tradepro/dto/RefreshTokenRequest.java`
- `backend/src/main/resources/application.properties`
- `backend/src/main/resources/application-prod.properties`

### Files to create
- `backend/src/main/java/com/tradepro/entity/RefreshToken.java`
- `backend/src/main/java/com/tradepro/repository/RefreshTokenRepository.java`
- `backend/src/main/java/com/tradepro/service/RefreshTokenService.java`
- `backend/src/main/java/com/tradepro/security/RequestIdFilter.java`
- `backend/src/main/java/com/tradepro/security/RefreshTokenFilter.java`
- `backend/src/main/java/com/tradepro/dto/LogoutResponse.java`
- `backend/src/main/java/com/tradepro/dto/TokenResponse.java`

### Dependencies
- `io.jsonwebtoken:jjwt` (already present)
- Potential `de.mkammerer:argon2-jvm` if Argon2id chosen
- `org.slf4j:slf4j-api` already present through spring

### Database changes
- Add `refresh_tokens` table.
- Add refresh token metadata: token hash, user, device info, expires, revoked, replacedBy.
- Add session and device tables with indexes.

### API changes
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/logout-all`
- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/setup-totp`
- `POST /api/auth/verify-totp`
- `GET /api/auth/me`

### Frontend changes
- Replace token storage with memory-first access token handling.
- Use secure `HttpOnly` cookie for refresh token.
- Update `src/services/api.js` for auth cookie behavior.
- Update `authSlice` to support refresh token rotation and session state.
- Add UI flows for OTP/TOTP if missing.

### Tests
- Unit tests for `AuthService`, `JwtService`, `RefreshTokenService`, `OtpService`.
- Integration tests for auth endpoints.

### Acceptance criteria
- Registration and login work.
- JWT access token valid and short-lived.
- Refresh endpoint rotates tokens.
- Logout invalidates session.
- OTP send/verify works with rate limits.
- TOTP setup/verification flows work.

---

## PHASE 2 — Database + Redis

### Goals
- Remove local JVM state dependencies.
- Add Redis-backed distributed state.
- Harden database config and migrations.

### Files to modify
- `backend/src/main/java/com/tradepro/config/RedisConfig.java`
- `backend/src/main/java/com/tradepro/config/DatabaseConfig.java`
- `backend/src/main/resources/application.properties`
- `backend/src/main/resources/application-prod.properties`
- `backend/Dockerfile`
- `docker-compose.yml`
- `render.yaml`

### Files to create
- `backend/db/migration/V1__initial_schema.sql`
- `backend/db/migration/V2__auth_and_order_schema.sql`
- `backend/src/main/java/com/tradepro/config/FlywayConfig.java`

### Dependencies
- `org.flywaydb:flyway-core`
- Redis already present via Spring Data Redis.

### Database changes
- Add migrations for users, sessions, refresh tokens, trades, ledger, positions, orders.
- Move from `ddl-auto=update` to migrations.
- Add indexes on email, refresh token hash, user_id, order state.

### API changes
- None direct — backend uses new schema.

### Frontend changes
- None direct.

### Tests
- Validate DB migrations run.
- Ensure Redis connectivity via integration tests.

### Acceptance criteria
- PostgreSQL can be used reliably in prod profile.
- Redis is used for OTP, rate limits, idempotency.
- Schema version control exists.

---

## PHASE 3 — Order Management System

### Goals
- Introduce formal order model, states, validation, idempotency.
- Preserve existing trade placement UI.

### Files to modify
- `backend/src/main/java/com/tradepro/controller/TradeController.java`
- `backend/src/main/java/com/tradepro/service/TradeService.java`
- `backend/src/main/java/com/tradepro/entity/Trade.java`
- `backend/src/main/java/com/tradepro/repository/TradeRepository.java`
- `backend/src/main/java/com/tradepro/dto/OrderRequest.java`
- `backend/src/main/java/com/tradepro/dto/OrderResponse.java`

### Files to create
- `backend/src/main/java/com/tradepro/entity/Order.java`
- `backend/src/main/java/com/tradepro/entity/OrderState.java`
- `backend/src/main/java/com/tradepro/entity/TradeExecution.java`
- `backend/src/main/java/com/tradepro/repository/OrderRepository.java`
- `backend/src/main/java/com/tradepro/service/OrderService.java`
- `backend/src/main/java/com/tradepro/service/OrderStateMachine.java`
- `backend/src/main/java/com/tradepro/service/OrderValidator.java`
- `backend/src/main/java/com/tradepro/service/IdempotencyService.java`
- `backend/src/main/java/com/tradepro/entity/IdempotencyKey.java`
- `backend/src/main/java/com/tradepro/repository/IdempotencyKeyRepository.java`

### Dependencies
- None new, apart from database schema.

### Database changes
- Add `orders`, `order_executions`, `idempotency_keys` tables.
- Add relevant foreign keys and state indexes.

### API changes
- Keep current endpoints; internally map to new order model.
- Add optional idempotency header support.

### Frontend changes
- Add idempotency key header generation for order placement.
- Preserve UI behavior.

### Tests
- Unit tests for `OrderStateMachine`, `OrderService`, `OrderValidator`.
- Simulate duplicate order requests.

### Acceptance criteria
- Order lifecycle exists.
- Duplicate order requests with same idempotency key return same order.
- Order state transitions are correct.

---

## PHASE 4 — Risk + Margin

### Goals
- Add risk engine and margin reservation.
- Validate orders before execution.

### Files to modify
- `backend/src/main/java/com/tradepro/service/OrderService.java`
- `backend/src/main/java/com/tradepro/service/OrderValidator.java`
- `backend/src/main/java/com/tradepro/entity/User.java`
- `backend/src/main/java/com/tradepro/repository/UserRepository.java`

### Files to create
- `backend/src/main/java/com/tradepro/service/RiskService.java`
- `backend/src/main/java/com/tradepro/entity/Balance.java`
- `backend/src/main/java/com/tradepro/entity/Position.java`
- `backend/src/main/java/com/tradepro/repository/BalanceRepository.java`
- `backend/src/main/java/com/tradepro/repository/PositionRepository.java`
- `backend/src/main/java/com/tradepro/service/MarginService.java`
- `backend/src/main/java/com/tradepro/entity/LedgerEntry.java`
- `backend/src/main/java/com/tradepro/repository/LedgerEntryRepository.java`

### Dependencies
- None new.

### Database changes
- Add balances, positions, ledger entries.
- Add candidate order reserve amounts.

### Frontend changes
- Display available/blocked margin in portfolio/trade page.

### Tests
- Margin reservation tests.
- Risk rejection tests.

### Acceptance criteria
- Orders are rejected for insufficient funds.
- Balance and margin are reserved atomically.
- Duplicate concurrent orders do not over-reserve funds.

---

## PHASE 5 — Execution abstraction

### Goals
- Introduce `BrokerGateway` abstraction.
- Decouple order service from broker implementation.

### Files to modify
- `backend/src/main/java/com/tradepro/service/OrderService.java`
- `backend/src/main/java/com/tradepro/config/TradeConfig.java`

### Files to create
- `backend/src/main/java/com/tradepro/broker/BrokerGateway.java`
- `backend/src/main/java/com/tradepro/broker/SimulatorGateway.java`
- `backend/src/main/java/com/tradepro/broker/RealBrokerGateway.java`
- `backend/src/main/java/com/tradepro/broker/BrokerGatewayFactory.java`

### Dependencies
- None new.

### Frontend changes
- None until broker status display is added.

### Tests
- `SimulatorGateway` execution tests.

### Acceptance criteria
- System can execute orders via simulator gateway.
- Broker abstraction is pluggable.

---

## PHASE 6 — Trading simulator

### Goals
- Build realistic simulator engine.
- Support order types, partial fills, cancellations.

### Files to create
- `backend/src/main/java/com/tradepro/simulator/SimulatorEngine.java`
- `backend/src/main/java/com/tradepro/simulator/SimulatedExecutionService.java`
- `backend/src/main/java/com/tradepro/config/SimulatorConfig.java`

### Dependencies
- None new.

### Tests
- Simulator acceptance tests.

### Acceptance criteria
- Market and limit orders process realistically.
- Partial fills occur.
- Cancel/modify works.

---

## PHASE 7 — WebSockets

### Goals
- Add secure real-time WebSocket channels.
- Private updates for orders/positions.

### Files to create
- `backend/src/main/java/com/tradepro/config/WebSocketConfig.java`
- `backend/src/main/java/com/tradepro/ws/MarketWebSocketHandler.java`
- `backend/src/main/java/com/tradepro/ws/PrivateWebSocketHandler.java`
- `backend/src/main/java/com/tradepro/ws/WebSocketAuthInterceptor.java`
- `frontend/src/hooks/useWebSocket.js`
- `frontend/src/services/wsClient.js`

### Dependencies
- `org.springframework.boot:spring-boot-starter-websocket`
- `org.springframework:spring-messaging`

### Frontend changes
- Market and private WS integration.
- UI connection state: LIVE, RECONNECTING, OFFLINE.
- Reconciliation of missed events.

### Tests
- WebSocket auth and event delivery tests.

### Acceptance criteria
- Market data streams over WS.
- Private order updates delivered to authenticated user only.

---

## PHASE 8 — Market data

### Goals
- Replace polling with pub/sub-backed feed.
- Introduce provider abstraction.

### Files to modify
- `backend/src/main/java/com/tradepro/controller/MarketDataController.java`
- `backend/src/main/java/com/tradepro/service/MarketDataService.java`

### Files to create
- `backend/src/main/java/com/tradepro/market/MarketDataProvider.java`
- `backend/src/main/java/com/tradepro/market/MarketDataSimulator.java`
- `backend/src/main/java/com/tradepro/market/MarketDataScheduler.java`

### Dependencies
- None new.

### Frontend changes
- Consume WS market data and reduce HTTP polling.

### Tests
- Market data provider tests.

### Acceptance criteria
- Market data available through WS and HTTP fallback.
- Caching shared via Redis.

---

## PHASE 9 — Portfolio/P&L

### Goals
- Track positions and P&L properly.
- Compute realized/unrealized P&L.

### Files to create
- `backend/src/main/java/com/tradepro/service/PositionEngine.java`
- `backend/src/main/java/com/tradepro/service/PnlEngine.java`
- `backend/src/main/java/com/tradepro/dto/PositionDto.java`
- `backend/src/main/java/com/tradepro/dto/PnlDto.java`

### Database changes
- Position records and holdings.

### Frontend changes
- Display portfolio and P&L in `PortfolioPage`.

### Tests
- Position calculation tests.
- P&L accuracy tests.

### Acceptance criteria
- Positions update only on confirmed executions.
- P&L values computed correctly.

---

## PHASE 10 — Event-driven architecture

### Goals
- Add message queue for async processing.
- Emit domain events.

### Files to create
- `backend/src/main/java/com/tradepro/events/Event.java`
- `backend/src/main/java/com/tradepro/events/EventPublisher.java`
- `backend/src/main/java/com/tradepro/events/EventConsumer.java`
- `backend/src/main/java/com/tradepro/events/OrderEvent.java`
- `backend/src/main/java/com/tradepro/events/TradeEvent.java`

### Dependencies
- `org.springframework.boot:spring-boot-starter-amqp` or `spring-kafka`.

### Frontend changes
- None direct.

### Tests
- Event publish/consume tests.

### Acceptance criteria
- Order events are emitted and consumed asynchronously.
- Dead-letter handling exists.

---

## PHASE 11 — Observability

### Goals
- Add metrics, logs, traces, request correlation.

### Files to modify
- `backend/src/main/java/com/tradepro/security/RequestIdFilter.java`
- `backend/src/main/resources/application.properties`
- `backend/src/main/resources/application-prod.properties`
- `backend/src/main/java/com/tradepro/config/ObservabilityConfig.java`

### Dependencies
- `io.micrometer:micrometer-registry-prometheus`
- `io.opentelemetry:opentelemetry-sdk`
- `io.opentelemetry:opentelemetry-exporter-otlp`

### Frontend changes
- Minimal health/failure UI integration.

### Tests
- Ensure metrics endpoints are exposed.

### Acceptance criteria
- `X-Request-ID` propagated.
- Metrics and tracing hooks present.

---

## PHASE 12 — Production infrastructure

### Goals
- Harden Dockerfiles and deployment config.
- Prepare CI/CD.

### Files to modify
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.yml`
- `render.yaml`
- `README.md`

### Files to create
- `.github/workflows/ci.yml`
- `.github/workflows/cd.yml`
- `backend/.dockerignore`
- `frontend/.dockerignore`

### Dependencies
- None new.

### Tests
- Build pipeline on GitHub Actions.

### Acceptance criteria
- Backend and frontend Docker images build.
- CI pipeline runs lint/build/tests.

---

## PHASE 13 — Disaster recovery

### Goals
- Document and route recovery.
- Implement backup/restore recommendations.

### Files to create
- `docs/DISASTER_RECOVERY.md`
- `docs/DR_PLAYBOOK.md`

### Acceptance criteria
- Recovery plan documented.

---

## PHASE 14 — Security testing

### Goals
- Audit major vulnerabilities.
- Add semgrep/sast rules.

### Files to modify
- `security/semgrep-rules.yml`
- `.github/workflows/security.yml`

### Acceptance criteria
- Security scan integrated.

---

## PHASE 15 — Load testing

### Goals
- Add basic performance testing for auth and trades.

### Files to create
- `load-tests/README.md`
- `load-tests/auth-locust.py` or JMeter scripts.

### Acceptance criteria
- Load test scripts exist and execute.

---

## Notes
- Do not modify core frontend experience; preserve UI components.
- Implement new backend features incrementally, preserving existing API compatibility.
- Where external services are unavailable, create stable abstractions with simulation.
