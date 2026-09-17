# Seguridad — Voltios y Ruedas

Nota del mini SB del proyecto. **Sin secretos reales.** No leer ni pegar `.env`.

## Datos

- **Público:** catálogo/landing si aplica; docs Swagger solo donde se exponga a propósito.
- **PII:** datos de clientes, vehículos asociados, reservas, contactos.
- **Interno:** órdenes de taller, inventario, métricas de Actuator.
- **Secretos:** `JWT_SECRET` y credenciales de Postgres/Redis **solo en variables de entorno / secret store** — nunca en el repo. Plantilla: `.env.example` con placeholders.

## Roles

| Rol | Notas de authz |
|-----|----------------|
| `ADMIN` | Acceso amplio de administración |
| `JEFE_TALLER` | Operación de taller / supervisión |
| `MECANICO` | Órdenes y trabajo de taller acotado |
| `CLIENTE` | Reservas y datos propios |

Authz por recurso en API (no solo ocultar botones en React).

## Superficies

- [x] Web (React/Vite)
- [x] API (Spring Boot 3)
- [ ] Jobs / cron (anotar si aparecen)
- [ ] Webhooks (anotar si aparecen)
- [x] Admin (rutas/roles admin)
- [x] Actuator (ops — no exponer sin control)
- [x] Swagger (docs API — restringir en entornos compartidos)

## Controles activos (hechos conocidos del proyecto)

- **Authn:** JWT; blacklist en **Redis** para invalidación/logout.
- **Authz:** roles anteriores en endpoints/controllers; camino negativo obligatorio en review.
- **Password hashing:** BCrypt factor ≥ 12.
- **Refresh tokens:** se persiste **hash SHA-256** (nunca el JWT en claro); lookup por hash; rotación/revocación intactas. Migración Flyway `V7` invalida tokens legacy en texto plano.
- **emailVerificado FAIL-CLOSED:** default `false` en entidad + default DB (`V6`); login/refresh exigen `emailVerificado == true`. Legacy V5 quedó TRUE y **no** se fuerza false en backfill (documentado en migración).
- **validarAcceso\* FAIL-CLOSED:** principal ≠ `Usuario` → 401 vía `SecurityUtils.requerirUsuario` (nunca return vacío).
- **Respuestas API:** Inventario y Auditoría exponen **DTOs** (no entidades JPA).
- **Mail post-TX:** side-effects de correo vía `AfterCommit` (fuera de la TX de negocio).
- **Errores:** dominio tipado (`ApiException`); `GlobalExceptionHandler` no filtra `getMessage()` técnico en 500/RuntimeException.
- **permitAll:** solo rutas auth públicas (`login`, `register`, `refresh`, recuperación/verificación). `/me`, preferencias y `logout` autenticados.
- **Rate limit:** incluye `/api/auth/refresh`. `X-Forwarded-For` solo si `app.security.trust-forwarded-headers=true` (proxy conocido; en compose nginx → true).
- **Compose prod-like:** no publica 5432/6379/8080 al host; nginx `:80` es la puerta; sin password default débil (`:?` en env).
- **Secret store:** env (local vía `.env` no versionado; prod vía store del entorno). `JWT_SECRET` **no** va en el repo.
- **Datos:** Postgres; migraciones **Flyway** (`V1`…`V7`).
- **Headers / TLS:** según despliegue (nginx / compose) — validar en pre-deploy.
- **SCA / deps:** lockfiles + revisión en PRs que toquen dependencias.

## Prohibido en logs

- tokens JWT, passwords, header `Authorization`, `JWT_SECRET`, cuerpos con PII de clientes

## Needs validation (prod / edge / IdP)

- Exposición real de Actuator/Swagger en cada entorno
- Terminación TLS / HSTS en el edge (nginx u otro)
- Rotación operativa de `JWT_SECRET` e invalidación masiva de sesiones
- Confirmar que en el host de prod **no** quedan publicados 5432/6379/8080
- Tras deploy: usuarios deben re-login (refresh tokens invalidados por `V7`)
- `TRUST_FORWARDED_HEADERS=true` solo detrás de proxy que limpie/sobrescriba XFF
- Smoke: `/api/auth/me` y `/api/auth/logout` rechazan sin Bearer (401)

## Contacto

- Auditorías formales: Nick Fury → Black Widow
- Día a día: Thermos (pasada security) + esta nota + [[Pre-deploy]]

## Relacionado

- Vault general: `C:\Users\Leon\Documents\Obsidian\Second brain\Ciberseguridad\`
- Mini SB: `docs/second-brain/Ciberseguridad/`
