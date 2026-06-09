# PDF2ZUGFeRD — Development Guide

## Project Overview

Spring Boot 3.2.5 / Java 21 service that converts PDFs to PDF/A-3 and embeds ZUGFeRD-compliant XML (Factur-X 2.2) for electronic invoicing. Includes an integrated React 19 + TypeScript frontend.

**Primary endpoint:** `POST /api/v1/convert` — accepts a PDF file and optional ZUGFeRD XML, returns a PDF/A-3 document.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Java 21 |
| Framework | Spring Boot 3.2.5 |
| Database | PostgreSQL 15 |
| ORM | Spring Data JPA / Hibernate |
| DB Migrations | Flyway 10 |
| Object Mapping | MapStruct 1.6.3 |
| Boilerplate | Lombok 1.18.32 |
| PDF/ZUGFeRD | Mustang 2.23.1 |
| Rate Limiting | Bucket4j 8.10.1 |
| API Docs | springdoc-openapi 2.5.0 |
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4 |
| UI Components | Radix UI, Framer Motion, react-dropzone |
| HTTP Client | Axios |
| Testing | JUnit 5, Testcontainers (PostgreSQL) |
| Build | Maven + frontend-maven-plugin |
| Container | Docker + Docker Compose |

---

## Package Structure

```
src/main/java/com/vcapelcin/pdf2zugferd/
├── controller/       REST controllers (versioned /api/v1)
├── service/          Business logic (PDF conversion, XML validation, file storage)
├── model/            JPA entities (extends BaseEntityUUID)
├── repository/       Spring Data JPA repositories
├── config/           Spring @Configuration classes
├── exception/        GlobalExceptionHandler
└── dto/              Request/response records

src/main/frontend/
├── src/components/   Reusable UI components (ui/, forms, dialogs)
├── src/pages/        Page-level route components
├── src/services/     Axios API service layer
├── src/hooks/        Custom React hooks
├── src/utils/        Utility functions (zugferdParser.ts)
└── src/types/        TypeScript type definitions

src/main/resources/
├── application.properties
├── db/migration/     Flyway scripts (V1__initial_schema.sql …)
└── xsd/zugferd22/    factur-x.xsd — ZUGFeRD XML schema
```

---

## Spring Boot Guidelines

### 1. Constructor Injection

Declare dependencies as `final` fields and inject via constructor. Spring auto-detects a single constructor — no `@Autowired` needed.

```java
@Service
class PdfConversionService {
    private final ConversionRepository conversionRepository;
    private final FileStorageService fileStorageService;

    PdfConversionService(ConversionRepository conversionRepository,
                         FileStorageService fileStorageService) {
        this.conversionRepository = conversionRepository;
        this.fileStorageService = fileStorageService;
    }
}
```

### 2. Package-private Visibility

Declare controllers, `@Configuration` classes, and `@Bean` methods with package-private visibility unless a broader scope is explicitly required.

### 3. Typed Configuration Properties

Group related properties under a common prefix and bind to a `@ConfigurationProperties` class with validation. Prefer environment variables over profiles for environment-specific values.

### 4. Transaction Boundaries

- Annotate query-only service methods with `@Transactional(readOnly = true)`.
- Annotate data-modifying methods with `@Transactional`.
- Keep the transactional scope as small as possible.

### 5. No Open Session in View

`spring.jpa.open-in-view=false` is set. Fetch exactly what is needed using fetch joins or explicit queries. Never rely on lazy loading outside a transaction.

### 6. DTOs — Separate Web and Persistence Layers

Do not expose JPA entities directly in controller responses. Define explicit request/response record classes in `dto/`. Apply Jakarta Validation annotations on request records. Use MapStruct for entity ↔ DTO conversions.

### 7. REST API Design

- URL structure: `/api/v{version}/resources` (e.g., `/api/v1/convert`)
- Return correct HTTP status codes via `ResponseEntity<T>`
- Use camelCase for JSON property names consistently
- See [Zalando RESTful API Guidelines](https://opensource.zalando.com/restful-api-guidelines/) for comprehensive guidance

### 8. Command Objects

Wrap service method inputs in purpose-built command records (e.g., `ConversionCommand`) to communicate exactly what data is expected.

### 9. Centralized Exception Handling

`GlobalExceptionHandler` (`@RestControllerAdvice`) handles all exceptions. Follow the existing pattern — return `ProblemDetail` (RFC 9457) with a consistent structure. Do not add try/catch blocks in controllers.

### 10. Actuator

Only `health`, `info`, and `metrics` endpoints are exposed without authentication. Do not expose additional endpoints in production.

### 11. Internationalization

Externalize all user-facing messages into ResourceBundle files. Do not hardcode strings in Java code.

### 12. Integration Tests — Testcontainers

Use Testcontainers for integration tests that require PostgreSQL. The test profile (`application-test.properties`) connects to a test database. Annotate integration test classes with `@Transactional` for automatic rollback.

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Transactional
class PdfConversionServiceTest { … }
```

### 13. Logging

Use SLF4J (via Lombok `@Slf4j`). Never use `System.out.println`. Guard expensive `DEBUG`/`TRACE` log calls:

```java
log.atDebug()
   .setMessage("Conversion details: {}")
   .addArgument(() -> computeExpensiveDetails())
   .log();
```

Do not log credentials, PII, or file content.

### 14. Database Migrations — Flyway

- Place migration scripts in `src/main/resources/db/migration/`
- Naming: `V{n}__{description}.sql` (e.g., `V6__add_profile_column.sql`)
- Migrations are immutable once applied to any environment
- Use PostgreSQL-compatible SQL (not H2 dialect)
- When adding a column with a foreign key: add the column first, add the constraint in a separate statement

### 15. Lombok

Use Lombok annotations to eliminate boilerplate (`@Slf4j`, `@Data`, `@Builder`, `@RequiredArgsConstructor`). Enable annotation processing in the IDE. Use `@SuperBuilder` when extending another class.

### 16. MapStruct

Use MapStruct for entity ↔ DTO conversions. After modifying a `@Mapper`, recompile the project to regenerate the implementation. When updating entities, fetch from the database first, then apply the mapper, then save.

### 17. No Parallelism / No Multithreading

Keep all code sequential and single-threaded.

- **Do not use**: `parallelStream()`, `CompletableFuture`, `@Async`, `ExecutorService`, WebFlux schedulers, `Thread`
- **Do not use**: `Atomic*` types unless there is a proven concurrent need
- **Do not run tests in parallel** (`junit.jupiter.execution.parallel.enabled=false`)
- **Do use**: `stream()`, synchronous service calls, Spring MVC (not WebFlux)

> Note: The existing `PdfConversionController` uses `DeferredResult` with `CompletableFuture` for the async timeout mechanism. When modifying this endpoint keep the pattern intact — do not introduce additional threads or async chains beyond what already exists.

---

## Frontend Guidelines

### Structure

Organize components by concern inside `src/main/frontend/src/`:

- `components/ui/` — Radix-based primitive components
- `components/` — Feature components (`FileUpload`, `PDFPreview`, `StatusDisplay`)
- `services/` — Axios API service layer
- `utils/` — Pure utility functions (`zugferdParser.ts`)
- `types/` — TypeScript interfaces

### API Service Layer

Centralize API calls in `services/`. Use Axios with interceptors for auth headers and error handling. Use TypeScript interfaces that match the Spring Boot response DTOs.

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 600_000, // match Spring async timeout
});
```

### UI Components — Radix UI + Tailwind

Use Radix UI primitives for accessible components (Dialog, Toast, Progress). Style with Tailwind CSS 4 and class-variance-authority for variant management.

### Build Integration

The Maven build (`mvn clean install`) runs `npm install` and `npm run build` via `frontend-maven-plugin`. The build output goes to `target/classes/static/` so Spring Boot serves it automatically.

For local development, run Vite dev server (`npm run dev`) inside `src/main/frontend/`. The `vite.config.ts` proxy forwards `/api` calls to `localhost:8080`.

### Code Quality

- ESLint + TypeScript-eslint rules are enforced
- No `any` types — use proper TypeScript interfaces
- React Hooks rules (`rules-of-hooks`, `exhaustive-deps`) are errors

---

## Key Configuration

```properties
# application.properties highlights
spring.servlet.multipart.max-file-size=50MB
spring.servlet.multipart.max-request-size=50MB
spring.mvc.async.request-timeout=600000          # 10-minute timeout for conversions
spring.jpa.open-in-view=false
management.endpoints.web.exposure.include=health,info,metrics
springdoc.api-docs.path=/api-docs
```

---

## Running the Application

**Backend only (requires PostgreSQL on localhost:5432):**
```bash
./mvnw spring-boot:run
```

**With Docker Compose (PostgreSQL + app):**
```bash
docker compose up --build
# App available at http://localhost:8084
```

**Frontend dev server (hot reload):**
```bash
cd src/main/frontend && npm install && npm run dev
# Dev server at http://localhost:5173, proxies /api → localhost:8080
```

**Full build (backend + frontend JAR):**
```bash
./mvnw clean install
```

---

## Running Tests

```bash
# All tests (requires Docker for Testcontainers)
./mvnw test

# Unit tests only (skip integration)
./mvnw test -Dtest=PdfToPdfA3ApplicationTests
```

Test isolation is guaranteed by:
- `@Transactional` on integration test classes (automatic rollback)
- `@SpringBootTest(webEnvironment = RANDOM_PORT)` to avoid port conflicts
- Testcontainers provisions a real PostgreSQL instance per test run

---

## Conversion Entity Lifecycle

```
Conversion status: PROCESSING → COMPLETED | FAILED
```

Every conversion is persisted to the `conversions` table with:
- `filename`, `target_filename`, `xml_filename`
- `original_size`, `converted_size`, `xml_size` (bytes)
- `processing_time_ms`, `ip_address`
- `error_message` (TEXT, populated on failure)
- `created_date`, `last_modified_date` (managed by Hibernate)

---

## ZUGFeRD-Specific Notes

- ZUGFeRD profile is passed as a request parameter (`profile=BASIC` by default)
- XML is validated against `factur-x.xsd` before PDF embedding
- Mustang validates the output PDF/A-3 compliance after conversion
- PDF files > 2MB skip the verapdf validation step (performance optimization, configurable)
- Validation errors are serialized to Base64 JSON and returned in both the response body and `X-XML-Validation-Errors` header
