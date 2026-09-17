# Rúbrica local — Voltios y Ruedas (Thermos)

## Diff canónico

- Base sugerida: **`main`** (si no existe, rama default del repo).
- Comando típico: `git diff main...HEAD` (+ archivos tocados).
- Fuera de alcance ruidoso: lockfiles masivos, generated, `node_modules`, `target/`, builds.

## Paths sensibles (prioridad bugs/security)

Tratar como bloqueante si el patch los toca sin evidencia de camino negativo / authz:

| Área | Pistas de path / símbolo |
|------|---------------------------|
| Security filter chain | `SecurityConfig` |
| JWT | `Jwt*`, blacklist Redis, claims, expiración |
| Auth | `Auth*`, login/refresh/logout, registro |
| Controllers / API | controllers de auth, reservas, taller, vehiculo, inventario |
| Secrets template | `.env.example` (nunca `.env` con secretos reales en el review report) |
| Compose / proxy | `compose.yml` / `docker-compose*.yml`, `nginx` |
| Migraciones | Flyway / `db/migration*` |
| Router RBAC (front) | `App.tsx`, `RutaConRoles`, `utils/roles.ts` — el Sidebar **no** es authz |
| Sesión persistida | `authStore` + `GET /api/auth/me` al hidratar; no confiar rol stale |
| Fallos de UI | `ErrorBoundary` montado en `main`/`App` con fallback + reintento |

## Capas y módulos

- Backend: Spring Boot 3 (módulos **auth / reservas / taller / vehiculo / inventario**).
- Frontend: React + Vite.
- Datos: Postgres; caché/blacklist: Redis.
- Docs API: Swagger; ops: Actuator.

## Roles (authz)

`ADMIN` · `JEFE_TALLER` · `MECANICO` · `CLIENTE`

Todo cambio de `@PreAuthorize` / Security filter / claims debe probar **camino negativo** (rol incorrecto → 401/403).

## Umbrales de calidad

- Archivo que se acerca o supera ~**1000 líneas** y el patch lo engorda → hallazgo code-quality (corte o justificación).
- Boundaries: UI no importa infra; dominio no conoce detalles HTTP de transporte de más.
- No tragar excepciones ni filtrar stack/secretos en respuestas.

## Merge-ready desde Thermos (local)

- Ambas pasadas corridas (o ritual equivalente documentado).
- Sin medium+ abierto en paths sensibles sin dueño + evidencia.
- Dedupe hecho; incertidumbre explícita no ignorada.
