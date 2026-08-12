# Multi-stage Dockerfile for DocTrace AI Spring Boot Backend

# Stage 1: Build JAR using Maven with Eclipse Temurin JDK 21
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Copy pom.xml and resolve dependencies
COPY pom.xml ./
RUN mvn dependency:go-offline -B

# Copy source code and build production artifact
COPY src ./src
RUN mvn package -DskipTests

# Stage 2: Runtime environment using Eclipse Temurin JRE 21
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

# Create non-root user and group
RUN addgroup -S doctrace && adduser -S doctrace -G doctrace

# Copy built JAR artifact from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Ensure uploads directory exists and set permissions
RUN mkdir -p storage/uploads && chown -R doctrace:doctrace /app

USER doctrace

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
