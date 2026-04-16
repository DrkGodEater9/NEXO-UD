# Stage 1: Build the application
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw ./
COPY pom.xml ./
# Make sure mvnw is executable
RUN chmod +x mvnw
# Download dependencies
RUN ./mvnw dependency:go-offline
# Copy source code and build
COPY src ./src
RUN ./mvnw clean install -DskipTests

# Stage 2: Create the production image
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
# Copy the compiled jar from the build stage
COPY --from=build /app/target/*.jar app.jar
# Expose the port (Render assigns $PORT at runtime, usually 10000 or 8080)
# Run the application with explicit memory limits to prevent out of memory (OOM) crashes on free tiers
ENTRYPOINT ["java", "-Xmx256m", "-Xmx256m", "-jar", "app.jar"]
