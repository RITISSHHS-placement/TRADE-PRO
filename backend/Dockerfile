# ─────────────────────────────────────────────────────────────────────────────
# TradePro Backend — Two-stage Dockerfile
#
# Stage 1 (build): Maven full build inside Docker (used when no pre-built JAR)
# Stage 2 (run):   Eclipse Temurin 17 JRE — minimal footprint
#
# For faster local builds, run `mvn package -DskipTests` first — Docker will
# COPY the JAR directly instead of re-downloading all dependencies.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

ENV MAVEN_OPTS="-Xmx512m -XX:MaxRAMPercentage=50.0"

# Cache dependency layer — only re-runs when pom.xml changes
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Build the application
COPY src ./src
RUN mvn clean package -DskipTests -q

# ── Stage 2: Run ──────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Non-root user for security
RUN useradd -r -s /bin/false appuser && chown appuser /app
USER appuser

EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:ActiveProcessorCount=2", \
  "-Xms128m", \
  "-Xmx512m", \
  "-XX:+UseG1GC", \
  "-XX:MaxMetaspaceSize=192m", \
  "-Dspring.profiles.active=prod", \
  "-jar", "app.jar"]
