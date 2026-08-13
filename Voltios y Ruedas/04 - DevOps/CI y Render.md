# CI y Render

> Integración continua con GitHub Actions y despliegue en Render.

## CI/CD (GitHub Actions)

Archivo: `.github/workflows/ci.yml`

| Job | Acciones |
|---|---|
| Backend | Compilar con Maven (`mvn clean package` / `test-compile`) |
| Frontend | `npm ci`, build, tests (`npm test`), lint |

Detalles del pipeline:
- Se habilitó la **compilación backend** y **tests frontend** en el pipeline.
- El backend compila los tests pero los ejecuta con tolerancia (`-DskipTests` en Docker) porque quedan tests de integración que fallan por entorno (ver [[05 - Testing/Pruebas del Backend|Pruebas del Backend]]).

## Render

Archivo: `render.yaml`

- **PostgreSQL** y **Redis** gestionados por Render.
- **App** con puerto dinámico (`PORT`), CORS configurable (`CORS_ALLOWED_ORIGINS`) y variables de entorno.
- Configs Java: `RenderDataSourceConfig`, `RenderRedisConfig` en `common/config/`.

## Variables en Render

- `JWT_SECRET`, `POSTGRES_USER/PASSWORD`, `REDIS_HOST/PORT/PASSWORD`, `CORS_ALLOWED_ORIGINS`, `SPRING_PROFILES_ACTIVE=prod`, `MAIL_*`.

## Notas

- La app escucha en `${PORT:8080}` para adaptarse a Render.
- Redis requerido al arrancar (Spring Boot exige conexión).
- El perfil prod usa `ddl-auto=validate` + Flyway (esquema por migraciones).

Ver también: [[04 - DevOps/Docker y Compose|Docker y Compose]].

Volver a [[Home]].