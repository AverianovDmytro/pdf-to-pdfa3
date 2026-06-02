FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Expecting the jar to be in the target/ folder or same directory
# Change path if you place the jar elsewhere
COPY pdf-to-pdfa3-0.0.1.jar app.jar

EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
