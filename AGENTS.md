# AGENTS.md - Voltios y Ruedas (Monolito)

## 1. Quickstart

- **Levantar todo con Docker Compose:**
  ```bash
  docker compose up -d --build
  ```
- **App:** http://localhost (nginx proxy en puerto 80)
- **Swagger:** http://localhost/swagger-ui/
- **Health:** http://localhost:8080/actuator/health
- **Reconstruir solo el frontend:** `docker compose build frontend && docker compose up -d frontend`
- **Logs:** `docker compose logs -f frontend|app|postgres|redis`

## 2. Environment

- **`.env`** never commite con valores reales. Ya está en `.gitignore`.
- **`.env.example`** contiene valores de referencia (sólo configuraciones seguras).
- **Variables críticas:**
  - `JWT_SECRET`: debe tener ≥32 caracteres (preferiblemente 64), generado con `openssl rand -base64 64`. Proveniente obligatoriamente de variable de entorno, NUNCA hardcodeado en código.
  - `SPRING_PROFILES_ACTIVE`: dev | staging | prod (por defecto `prod` en Docker).
  - `MAIL_ENABLED`: en `dev` es `false` → tokens de recuperación se devuelven en la respuesta; en prod van por SMTP.
  - `FRONTEND_URL`: usada en correos de recuperación (`http://localhost:5173`).

## 3. Stack tecnológico (versiones reales)

| Capa | Tecnología |
|------|-----------|
| Backend | Java 21, **Spring Boot 3.3.4** (Web, Data JPA, Security, Validation) |
| Frontend | **React 19**, **Vite 8**, TypeScript, Tailwind CSS 4 |
| BD | PostgreSQL 16 + Redis 7 |
| Build | Maven 3, Node 24 |

## 4. Estructura de módulos Java

Paquete base: `com.voltiosyruedas.taller`. Módulos obligatorios:

- **auth** → Usuario, Rol, login/register, JWT (SecurityConfig, JwtUtil, JwtAuthenticationFilter), AuthService, EmailVerificationService, PasswordResetService, TokenBlacklistService
- **reservas** → Reserva, CategoriaServicio, ReservaService, ReservaController
- **taller** → OrdenTrabajo (estados: RECIEN_INGRESADO→POR_INGRESAR→TRABAJANDO→TERMINADO→ENTREGADO), BitacoraOrden, OrdenTrabajoService, OrdenTrabajoController
- **inventario** → Repuesto, Categoria, MovimientoInventario, InventarioService (con `@Transactional` en ops de stock), InventarioController
- **vehiculo** → Vehiculo (estados), VehiculoService, VehiculoController

**Subdirectorios obligatorios por módulo:** `entity/`, `dto/`, `repository/`, `service/`, `controller/`

*Nota:* También hay módulos `auditoria`, `notificaciones` y `common` (exceptions, config).

## 5. Seguridad

- **Autenticación:** JWT (HS256) con secreto de ≥32 caracteres desde `JWT_SECRET` env. Token de acceso expira en **15 min**.
- **Refresh tokens:** `/api/auth/refresh` con **rotación** (revoca el anterior y emite uno nuevo). Persistidos en BD (`refresh_tokens` con flag `revocado`, V4 de Flyway). Expiración por defecto **12 horas** (`jwt.refresh.expiration`, configurable vía `JWT_REFRESH_EXPIRATION` en ms). El logout revoca todos los refresh tokens activos del usuario (`AuthService.cerrarSesion`).
- **BCrypt:** factor de trabajo **≥ 12** (`new BCryptPasswordEncoder(12)`). Ver en `SecurityConfig.java:142`.
- **Rate limiting:** `/api/auth/login` limitado a 5 intentos/5min vía Bucket4j (filtro `RateLimitingFilter`).
- **Token blacklist:** Redis-backed para logout. `TokenBlacklistService` invalida tokens en `/api/auth/logout`.
- **CORS:** configurada desde `app.cors.allowed-origins` en application.properties. Orígenes por defecto: `http://localhost:5173,http://localhost:3000`.
- **Headers de seguridad:** HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, CSP en `SecurityConfig.java:88-98`.

### Roles y endpoints protegidos

| Rol | Endpoints |
|-----|-----------|
| ADMIN | `/api/usuarios/**, /api/auditoria/**, /api/inventario/**` |
| JEFE_TALLER | `/api/usuarios/**, /api/reservas/**, /api/ordenes/**, /api/inventario/**` |
| MECANICO | `/api/reservas/**, /api/ordenes/**, /api/inventario/**` |
| CLIENTE | `/api/reservas/**, /api/ordenes/**, /api/vehiculos/**, /api/notificaciones/**` |

- `/api/auth/**` y `/actuator/health` son `permitAll()`.

## 6. Testing

### Backend (Maven)

- **Unitarias (sin BD):** `mvn clean test -DskipITs`
- **Integración:** `mvn verify` (algunas presentan fallos pendientes; CI compila sin ejecutarlas `-DskipTests`)
- **Cobertura:** `mvn test jacoco:report`
- **TestContainers:** ya configurado en `pom.xml` (`testcontainers.version 1.20.0`)

### Frontend (npm)

- **Vitest:** `npm run test`
- **Con UI:** `npm run test:watch` (`vitest`)
- **Cobertura:** `npm run coverage`

**Notas importantes:**
- Los tests de frontend están en `frontend/src/__tests__/` (no en `src/test/`).
- Usa `vi.mock()` para services y `@testing-library/react` para renderizar.
- 161 tests en total (según PROYECTO.md).

## 7. Migraciones de BD (Flyway)

- Ubicación: `backend/voltios_y_ruedas/src/main/resources/db/migration/`
- Nomenclatura: `V1__descripcion.sql`, `V2__descripcion.sql`, ...
- **Nunca** modificar una migración ejecutada; crear una nueva si es necesario.
- Migraciones actuales: `V1__init_schema.sql` → `V5__agregar_email_verificado.sql`.

## 8. Convencional Commits

Todos los commits **OBLIGATORIAMENTE** seguirán el estándar Conventional Commits:

```
<tipo>(<scope>): <descripción>
```

**Scopes disponibles:** `auth`, `reservas`, `taller`, `inventario`, `api`, `bd`, `seguridad`, `ui`, `config`, `docker`

**Tipos:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `security`

**Ejemplos:**
```
feat(auth): agregar recuperación de contraseña con email
fix(inventario): corregir cálculo de stock en asignación (falta @Transactional)
security(auth): aumentar JWT_SECRET a 64 caracteres (BREAKING CHANGE)
```

## 9. Comandos útiles

```bash
# Backend
cd backend/voltios_y_ruedas && ./mvnw clean package -DskipTests    # compilar rápido
./mvnw clean test                                          # unitarias + integración
./mvnw test jacoco:report                                  # con cobertura

# Frontend
cd frontend && npm run dev                                # servidor desarrollo (Vite)
npm run build                                             # build de producción
npm run test                                              # Vitest (headless)

# Docker
docker compose up -d --build                              # levantar todo
docker compose down                                       # apagar todo
docker compose logs -f app                                # logs del backend

# NGrok (opcional)
docker compose -f compose.yml -f compose.ngrok.yml up -d --build
```

## 10. Problemas conocidos / gotchas

- **CI skips integración tests:** El workflow `.github/workflows/ci.yml` compila backend con `-DskipTests` porque los tests de integración "presentan fallos pendientes" (ver comentario en línea 24-26 del workflow).
- **Sin SMTP en dev:** `MAIL_ENABLED=false` → tokens de recuperación devueltos en respuesta API, no por correo. Las cuentas de registro quedan `activas` y `emailVerificado=true` automáticamente.
- **Página `/reestablecer-password`:** El endpoint `POST /api/auth/reestablecer-password` existe, pero la página frontend aún no está implementada (solo el backend).
- **Nginx caché inmutable:** tras cada deploy, recargar con **Ctrl+Shift+R** en el navegador.
- **Redis obligatorio:** El servicio `app` depende de Redis para `TokenBlacklistService`; el container debe estar saludable antes de iniciar la app.

## 11. Reglas generales y convenciones de estilo

- **Idioma:** Todo el código (comentarios, nombres de variables, mensajes de error, respuestas de API) debe estar estrictamente en **español**.
- **Nombres:** `camelCase` para variables, métodos, propiedades JSON y atributos (Java + TypeScript); `PascalCase` para clases/interfaces; `SCREAMING_SNAKE_CASE` solo para constantes estáticas y enums.
- **Arquitectura:** Monolito modular en una sola instancia Spring Boot. Prohibido microservicios, API Gateways o llamadas HTTP internas entre módulos. Toda la lógica corre en una sola instancia conectada a una BD centralizada.
- **Validación backend:** Jakarta Validation (`@NotNull`, `@NotBlank`, `@Email`, `@Pattern`, etc.) en todos los DTOs, con `@Valid @RequestBody` en todo endpoint que reciba cuerpo. Nunca confiar solo en validación de cliente.
- **Validación frontend:** Formularios con **Zod** + **React Hook Form**, validación en tiempo real y errores específicos en español.
- **Errores de API:** Nunca exponer stack traces, paths internos ni detalles de BD. Formato centralizado en `common/exception/` (`ApiResponse`, `ErrorResponse`, `ApiException`).
- **SQL:** Solo consultas parametrizadas (Spring Data JPA, JPQL con parámetros nombrados, Criteria API). Prohibido concatenar strings en consultas.
- **Cobertura mínima:** 70% en servicios, 50% en controladores.

## Second brain del proyecto

Mini second brain adaptado (Thermos / QA / Ciberseguridad) en:

`docs/second-brain/`

Pedí «revisá el second brain» apuntando a esa ruta. Vault general: `C:\Users\Leon\Documents\Obsidian\Second brain\`.

