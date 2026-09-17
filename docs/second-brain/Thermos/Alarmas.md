# Alarmas (Thermos) — Voltios y Ruedas

Si ves esto en el diff o en la síntesis, pará: **importante** o **bloqueante** hasta evidencia o fix. No son nits.

## Bugs / roturas / seguridad (stack local)

- Cambio en `SecurityConfig`, `Jwt*`, `Auth*` o controllers de auth **sin** prueba de camino negativo (rol / token inválido / blacklist).
- JWT en Redis blacklist: logout o revocación que deja el token usable.
- Roles `ADMIN` / `JEFE_TALLER` / `MECANICO` / `CLIENTE` mal aplicados (IDOR entre cliente↔taller, inventario, órdenes).
- Frontend: RBAC solo en Sidebar; `/usuarios` o `/configuracion` se abren por URL con `MECANICO`/`CLIENTE`.
- Frontend: hidratar JWT/usuario desde persist sin `GET /api/auth/me` (rol stale en guards).
- Frontend: no hay `ErrorBoundary` en root — crash de página = pantalla blanca.
- `JWT_SECRET` u otros secretos en repo, logs, respuestas o `.env` commiteado (solo `.env.example` con placeholders).
- Actuator / Swagger expuestos sin control en entorno compartido.
- Validación solo en React para dato que cruza confianza (reservas, inventario, órdenes).
- Manejo de error que traga excepciones o expone stack/SQL/secretos.
- Migración Flyway / rename que rompe lectores viejos sin compat.
- Race o doble submit en cupos de reserva, órdenes de taller o movimientos de inventario.
- Cambio en `compose.yml` / nginx que abre puertos de Postgres/Redis/Actuator al host sin necesidad.

## Devex / regresión operativa

- Compose / scripts de arranque rotos o “funciona solo en mi máquina” sin doc.
- Variable nueva requerida (JWT, DB, Redis) sin default seguro ni mensaje claro (ver `.env.example`).
- Log sensato eliminado en path de fallo auth; debug spam en hot path.

## Code quality / estructura

- Archivo cerca de ~1000 líneas **y** el patch lo engorda.
- Spaghetti de roles/flags ad-hoc sin mapa.
- Abstracción nueva sin call sites claros.
- Boundaries rotos (UI importa infra; dominio conoce HTTP de más).
- Duplicación grande de reglas de authz en vez de un solo dueño.

## Proceso de review

- Se corrió solo una de las dos pasadas en un diff de auth/JWT/roles/migraciones.
- Síntesis sin dedupe: el mismo bug dos veces con distinta severidad.
- Hallazgos medium+ sin archivo/línea ni dueño.
- “LGTM” con incertidumbre explícita de un subagente ignorada.

## Falsas alarmas (no inflar)

- Estilo cosmético sin riesgo estructural cuando hay hallazgos mayores.
- Issue preexistente en archivo no tocado → fuera de alcance del diff.
- Preferencia estética de naming sin ambigüedad de comportamiento.
