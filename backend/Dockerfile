# ---- Build Stage ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
ENV MAVEN_OPTS="-Xmx512m -XX:MaxRAMPercentage=50.0"
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn clean package -DskipTests -q

# ---- Run Stage ----
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:ActiveProcessorCount=1", "-Xms64m", "-Xmx256m", "-XX:+UseSerialGC", "-XX:MaxMetaspaceSize=128m", "-XX:ReservedCodeCacheSize=64m", "-Dspring.profiles.active=prod", "-jar", "app.jar"]
