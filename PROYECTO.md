# Voltios y Ruedas — Estado del Proyecto

> Documento vivo: resume qué hay construido hasta hoy, cómo se ejecuta, qué se corrigió recientemente y cuáles son las tareas futuras sugeridas.

**Fecha:** 2026-08-11
**Stack:** Monolito Spring Boot + React (Vite) + PostgreSQL + Redis, todo en Docker Compose.

---

## 1. Qué es el sistema

Sistema de gestión para el taller automotriz **Voltios y Ruedas**:

- **Clientes:** registran sus vehículos, agendan/editan/cancelan reservas, ven el historial de órdenes, diagnósticos, repuestos y costos.
- **Staff (MECANICO / JEFE_TALLER / ADMIN):** dashboard con métricas, gestión de reservas, órdenes de trabajo, inventario, usuarios y configuración.

Roles: `ADMIN`, `JEFE_TALLER`, `MECANICO`, `CLIENTE`.

---

## 2. Stack y arquitectura

| Capa | Tecnología |
|------|-----------|
| Backend | Java 21, Spring Boot 3.3.4 (Web, Data JPA, Security, Validation), Spring Security + JWT (HS512), BCrypt (factor 12), Flyway, Lombok, springdoc-openapi (Swagger) |
| Frontend | React 19 + Vite 8 + TypeScript, Tailwind CSS (`darkMode: 'class'`), React Hook Form + Zod, Zustand (persistencia), Axios |
| BD | PostgreSQL 16 (volumen `pgdata`) |
| Caché/Redis | Redis 7 (volumen `redisdata`) |
| Proxy | Nginx (imagen final del frontend): sirve la SPA y proxya `/api/*`, `/swagger-ui/*`, `/v3/api-docs/*`, `/actuator/*` → app:8080 |
| Orquestación | Docker Compose con healthchecks en todos los servicios |

**Servicios y puertos:**

| Servicio | Contenedor | Puerto |
|----------|-----------|--------|
| app | `voltios_ruedas_app` | 8080 |
| frontend | `voltios_ruedas_frontend` | 80 |
| postgres | `voltios_ruedas_db` | 5432 |
| redis | `voltios_ruedas_redis` | 6379 |

**Estructura del backend** (`com.voltiosyruedas.taller`):

```
auth/        → Usuario, Rol, login/register, JWT (SecurityConfig, JwtUtil, JwtAuthenticationFilter), AuthService, UsuarioService
reservas/    → Reserva, categorías, mis-reservas, cancelar
taller/      → OrdenTrabajo (estados), bitácora, repuestos por orden, mi-historial, historial
vehiculo/    → Vehículo (estados), mis-vehiculos, CRUD por rol
inventario/  → Repuestos, stock-bajo, activos, CRUD
```

Migraciones Flyway en `backend/voltios_y_ruedas/src/main/resources/db/migration/` (`V1__init_schema.sql`, `V2__vehiculos.sql`).

---

## 3. Cómo levantar

```powershell
# Desde la raíz del repo
docker compose up -d --build

# Reconstruir y redeployar solo el frontend tras cambios
docker compose build frontend
docker compose up -d frontend

# Logs
docker compose logs -f frontend   # o app / postgres / redis
```

- **App web:** http://localhost
- **Swagger UI:** http://localhost/swagger-ui/ (también directo a app:8080/swagger-ui.html)
- **Health:** http://localhost:8080/actuator/health

> El frontend usa `VITE_API_URL` vacío a propósito → las llamadas son relativas (`/api/...`) y nginx hace de proxy reverso. **No** cambiar el prefijo de los servicios a `/api/`.

> Por la caché inmutable de nginx (assets `immutable, 1y`), tras cada deploy hay que recargar con **Ctrl+Shift+R**.

---

## 4. Credenciales de prueba (base de datos actual)

| Email | Rol | Contraseña |
|-------|-----|-----------|
| `admin2@test.com` | ADMIN | `admin123` |
| `josueleon.102013@gmail.com` | ADMIN | (registrada por el usuario) |
| `test@test.com` | CLIENTE | (registrada por el usuario) |
| `new@test.com` | CLIENTE | (registrada por el usuario) |
| `josueleon.102012@gmail.com` | CLIENTE | (registrada por el usuario) |

> ⚠️ `cliente@test.com` **no existe** en la BD. Los usuarios se crean desde la página de registro o con `POST /api/auth/register`. Los usuarios de prueba creados por el asistente se eliminan al terminar.

---

## 5. Páginas del frontend

**Públicas:** Landing (`/`), Login (`/login`), Registro (`/register`).

**Staff (`ADMIN`/`JEFE_TALLER`/`MECANICO`):**
- `/dashboard` — métricas, reservas/órdenes recientes, stock bajo, gráfica semanal
- `/reservas` — CRUD de citas
- `/ordenes` — órdenes de trabajo (repuestos, bitácora)
- `/inventario` — repuestos y stock
- `/usuarios` — CRUD de usuarios (ADMIN/JEFE)
- `/configuracion` — perfil, apariencia, notificaciones, seguridad, sistema (ADMIN/JEFE)

**Cliente:**
- `/mi-vehiculo` — alta/edición de vehículos
- `/mi-historial` — órdenes, diagnósticos, repuestos, bitácora y costos
- `/mis-reservas` — agenda/edita/cancela citas

Guardas de rutas en `App.tsx`: `RutaStaff`, `RutaCliente`, `RutaProtegida`. La raíz redirige según rol.

---

## 6. Correcciones recientes (última sesión de trabajo)

Backend:
- Agregado **Redis** al compose (requerido por Spring Boot al arrancar).
- Permitido **Swagger/OpenAPI** en `SecurityConfig`.
- Fix de **login** con `SecurityContextHolder.setAuthentication(...)` en `AuthService` (ClassCastException).
- Usuario admin recreado (id=1).

Frontend:
- Todos los `services/*.ts` usan el prefijo **`/api/`** (nginx solo proxya `/api/*`).
- **Bug crítico de cliente:** `vehiculoService.ts` no tenía `/api/` → las llamadas devolvían el `index.html` (200) y las páginas de cliente crasheaban al hacer `.map` sobre un string. Corregido y verificado (200 en `mis-vehiculos`, `mis-reservas`, `mi-historial`).
- Página `register` en blanco → `dark:bg-surface-950`→`dark:bg-surface-900` en `AuthLayout`.
- Dashboard: optional chaining en `reservasRes?.content`, `ErrorBoundary` global en `App`.
- Fix de TypeScript en `ConfiguracionPage` (`Check` import, `timezoneOptions` duplicado, `Switch` con `onChange(checked)`, tabs tipados con `TabId`), `validation.ts` (`rolId: z.coerce.number().optional()`), `UsuariosPage` (`rolId ?? 4`).
- **Modo oscuro completo:** fuente única de tema en `uiStore` (persist + clase `dark` en `<html>`), init sin parpadeo en `index.html`, `useDarkMode` delegando al store, `dark:` en layout, componentes UI (Button, Card, Input, Select, Switch, Badge, Modal, Table, Toast, Tabs) y todas las páginas.
- Páginas nuevas: `UsuariosPage`, `ConfiguracionPage` (rutas y navegación agregadas).

---

## 7. Problemas conocidos / notas

- **Chunk grande (~511 kB):** Vite avisa que el bundle supera 500 kB → pendiente code-splitting (ver tareas).
- **Notificaciones del Header** son estáticas (array hardcodeado) — no hay backend aún.
- **Botones placeholder:** "Ver todas"/"Ver reporte completo" no hacen nada.
- **Dashboard** conserva `console.log` de depuración.
- **`ConfiguracionPage`** guarda de forma simulada (`setTimeout`): cambio de contraseña, 2FA, timeout de sesión, logs y datos de perfil no se persisten en backend.
- **Reservas (cliente):** el backend solo permite *cancelar* a clientes (no actualizar) → el botón "Editar" de `MisReservasPage` puede dar 403 si el cliente intenta guardar.
- **`/perfil`** (enlace "Mi perfil" del Header) no tiene ruta definida → 404 de la SPA.
- **`/recuperar-password`** (enlace en Login) no tiene página ni endpoint.
- **Logout** solo limpia `localStorage`; no hay blacklist de tokens (agenda: ver tareas).
- El historial de usuarios incluye campos sensibles (`password` BCrypt) en la respuesta del listado — a revisar para no exponer el hash.

---

## 8. Tareas futuras sugeridas

### Prioridad alta
- [ ] **Code-splitting del frontend:** usar `React.lazy` + `Suspense` para las rutas (o `dynamic import`) y eliminar el warning de chunk > 500 kB.
- [ ] **Persistir configuración real:** endpoints backend para perfil, cambio de contraseña y preferencias de la página Configuración (hoy es simulado).
- [ ] **Conectar notificaciones del Header** a un backend real (o quitarlas si es puramente decorativo).
- [ ] **Endpoint de recuperación de contraseña** (`/recuperar-password`) + página, o quitar el enlace.
- [ ] **Página "Mi perfil"** (`/perfil`) o quitar el enlace del Header.
- [ ] **No exponer el hash de password** en `UsuarioResponse` (DTO sin `password`).

### Prioridad media
- [ ] **Refresh tokens (7 días) + blacklist en Redis** al hacer logout, según directrices de `AGENTS.md`.
- [ ] **Rate limiting** en `/api/auth/login` (Bucket4j u otro) para evitar fuerza bruta.
- [ ] **Headers de seguridad** (HSTS, X-Frame-Options, CSP, etc.) en el backend.
- [ ] **Backend para reservas de cliente:** permitir que el cliente edite su reserva (hoy solo cancelar), o esconder el botón "Editar" para CLIENTE.
- [ ] **Pruebas:** JUnit 5 + Mockito + TestContainers (backend) y Vitest + React Testing Library (frontend), con cobertura según `AGENTS.md` (≥70% servicios).
- [ ] **Dashboard real:** implementar acciones de los botones "Ver todas"/"Ver reporte completo" y quitar `console.log`.

### Prioridad baja / mejoras
- [ ] Persistir la preferencia "Sistema" del selector de tema (hoy se resuelve a claro/oscuro al guardar).
- [ ] Sistema de auditoría/logs de actividad (el toggle de Configuración no persiste).
- [ ] Paginación/filtros completos y búsquedas debounced en listados.
- [ ] CI/CD (GitHub Actions) con build + tests + security scan, y branches `develop`/`main` protegidas.
- [ ] Documentar CHANGELOG y versionado SemVer.
- [ ] Internacionalización (i18n) — ya hay opción de idioma en Configuración (sin efecto).

---

## 9. Referencias

- Directrices de arquitectura, seguridad y testing: **`AGENTS.md`** (raíz del repo).
- Migraciones de BD: `backend/voltios_y_ruedas/src/main/resources/db/migration/`.
- Config de proxy y caché: `frontend/nginx.conf`.
- Compose con healthchecks y volúmenes: `compose.yml`.
