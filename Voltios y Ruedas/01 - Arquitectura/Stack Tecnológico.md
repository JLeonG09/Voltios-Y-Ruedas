# Stack Tecnológico

> Vista general de las tecnologías usadas en **Voltios y Ruedas**. Arquitectura: **monolito modular** (prohibido microservicios según [[06 - Guías/Convenciones de Commits|AGENTS.md]]).

## Backend

| Tecnología | Uso |
|---|---|
| **Java 21** | Lenguaje |
| **Spring Boot 3.3.4** | Framework (Web, Data JPA, Security, Validation, Mail, Actuator) |
| **Spring Security + JWT** | Autenticación/autorización, firma HS512, tokens de acceso |
| **BCrypt (factor 12)** | Hash de contraseñas (mínimo exigido por AGENTS.md) |
| **JJWT 0.12.6** | Generación/validación de tokens |
| **Spring Data JPA** | Persistencia (Hibernate) |
| **Flyway** | Migraciones de BD versionadas |
| **Lombok** | Reducción de boilerplate |
| **springdoc-openapi** | Swagger UI (2.3.0) |
| **Bucket4j** | Rate limiting en login |
| **Redis (spring-data-redis)** | Blacklist de tokens, códigos de verificación, preferencias |
| **PostgreSQL 16** | Base de datos principal |
| **Maven** | Build y dependencias |

## Frontend

| Tecnología | Uso |
|---|---|
| **React 19 + Vite** | SPA |
| **TypeScript 6+** | Type safety |
| **Tailwind CSS 3.4** (`darkMode: 'class'`) | Estilos |
| **React Hook Form + Zod** | Formularios y validación en tiempo real |
| **Zustand (persist)** | Estado global (auth + ui) |
| **Axios** | Llamadas HTTP con interceptor de refresh |
| **React Router DOM 7** | Navegación, rutas protegidas |
| **Vitest + React Testing Library** | Testing |

## Infraestructura

| Capa | Tecnología |
|---|---|
| **Orquestación** | Docker Compose con healthchecks en todos los servicios |
| **Proxy reverso** | Nginx (imagen final del frontend) → proxya `/api`, `/swagger-ui`, `/v3/api-docs`, `/actuator` |
| **Túnel HTTPS** | ngrok (dominio estático `vocalist-wrongly-pedometer.ngrok-free.dev`) |
| **CI/CD** | GitHub Actions (`.github/workflows/ci.yml`) |
| **Cloud (desplegable)** | Render (render.yaml): Postgres, Redis, CORS, puerto dinámico |

## Servicios y puertos (Docker)

| Servicio | Contenedor | Puerto |
|---|---|---|
| app | `voltios_ruedas_app` | 8080 |
| frontend | `voltios_ruedas_frontend` | 80 |
| postgres | `voltios_ruedas_db` | 5432 |
| redis | `voltios_ruedas_redis` | 6379 |

## Decisiones clave de diseño

- **Frontend con `VITE_API_URL` vacío**: las llamadas son relativas (`/api/...`) y nginx hace de proxy reverso. Esto permite el mismo origen detrás de nginx/ngrok.
- **BCrypt con factor 12** y **JWT_SECRET desde entorno** (nunca hardcodeado).
- **`spring.jpa.hibernate.ddl-auto=validate`** + Flyway: el esquema solo cambia por migraciones versionadas.
- **Perfiles Spring**: `dev` por defecto, `prod` en Docker/Render (via `SPRING_PROFILES_ACTIVE`).

Volver a [[Home]].