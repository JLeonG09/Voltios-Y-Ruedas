# Voltios y Ruedas — Estado del Proyecto

> Documento vivo: resume qué hay construido hasta hoy, cómo se ejecuta, qué se corrigió recientemente y cuáles son las tareas futuras sugeridas.

**Fecha:** 2026-08-13
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
| Backend | Java 21, Spring Boot 3.3.4 (Web, Data JPA, Security, Validation), Spring Security + JWT (HS512), BCrypt (factor 12), Flyway, Lombok, springdoc-openapi (Swagger), spring-boot-starter-mail (SMTP) |
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

Migraciones Flyway en `backend/voltios_y_ruedas/src/main/resources/db/migration/` (`V1__init_schema.sql` → `V5__agregar_email_verificado.sql`).

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

**Públicas:** Landing (`/`), Login (`/login`), Registro (`/register`), Verificar email (`/verificar-email`), Recuperar contraseña (`/recuperar-password`).

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
- **Verificación de correo y cuenta pendiente:** al registrarse se genera un código de 6 dígitos por SMTP; la cuenta queda `pendiente` (`activo=false`, `emailVerificado=false`) hasta confirmar con `POST /api/auth/verificar-email`. El login de una cuenta pendiente devuelve `403` con mensaje claro (se maneja `DisabledException`). En dev (`MAIL_ENABLED=false`) el código se imprime por consola y la cuenta queda verificada para no bloquear el login.
- **Recuperación de contraseña por correo:** `POST /api/auth/recuperar-password` envía un token de un solo uso por SMTP con enlace `{FRONTEND_URL}/reestablecer-password?token=...`; en dev devuelve el token en la respuesta.
- **Notificaciones por correo:** aviso de agenda de diagnóstico al jefe de taller y cambios de estado de órdenes de trabajo al cliente/jefe.
- **Refresh tokens con rotación y reuso:** cada renovación revoca el token usado y emite uno nuevo; un refresh token reutilizado revoca toda la familia. El logout revoca los tokens activos.
- **Sesión por inactividad:** cierre automático tras el timeout configurado (`sesionTimeout`, 60 min por defecto) y al volver a una pestaña abandonada más allá del límite.
- **Validaciones CR:** teléfono de 8 dígitos con `+506` opcional y nombres/apellidos de 2 a 50 caracteres (aplicadas en backend y frontend).

Frontend:
- Página `/verificar-email` para confirmar el código y badge **Pendiente** en el panel de usuarios.
- Sesión persistida en `sessionStorage` (cerrar la pestaña cierra la sesión).
- Tests de integración y controladores en verde (**161 tests**) con `@WithMockUsuario` y fixtures.
- Fix de costos de repuestos: el subtotal ahora se calcula en Java (la columna generada en BD era `null` en memoria).

---

## 7. Problemas conocidos / notas

- **Página de reestablecer contraseña pendiente:** el correo de recuperación enlaza a `/reestablecer-password?token=...`, pero esa ruta/página aún no existe (el endpoint `POST /api/auth/reestablecer-password` sí está implementado y `reestablecerPassword` ya está en `authService.ts`).
- **Sesión en `sessionStorage`:** al cerrar la pestaña del navegador se pierde la sesión (comportamiento intencional para mitigar secuestro de sesión).
- **Envío de correos requiere SMTP:** configurar `MAIL_ENABLED`, `MAIL_USERNAME`, `MAIL_PASSWORD` y `FRONTEND_URL` (ver `.env.example`). En dev sin SMTP los códigos/tokens se loguean por consola.
- **Preferencia de tema "Sistema":** se resuelve a claro/oscuro al guardar; no se persiste el modo `system` como tal.
- **Auditoría parcial:** se registran acciones de órdenes e inventario en backend, pero el toggle de auditoría de la página Configuración no persiste.
- **i18n:** la opción de idioma en Configuración aún no tiene efecto.
- **Paginación:** los listados usan `Pageable`, pero la paginación/filtros completos en todas las tablas está pendiente (hoy hay búsqueda con debounce en reservas e inventario y filtros en usuarios/reservas).
- **Caché inmutable de nginx:** tras cada deploy recargar con **Ctrl+Shift+R**.

---

## 8. Tareas futuras sugeridas

### Prioridad alta
- [ ] **Página `/reestablecer-password`:** el correo de recuperación ya apunta a esta ruta y el endpoint backend existe; falta la página que reciba el `token` de la query y envíe el nuevo password.
- [ ] **Despliegue con SMTP real:** configurar credenciales SMTP (Brevo/Gmail) en producción para verificación de correo y notificaciones por email.
- [ ] **Backups de BD y HTTPS** en el despliegue de producción (Render ya ofrece TLS automático; falta política de backups).

### Prioridad media
- [ ] Persistir la preferencia **"Sistema"** del selector de tema (hoy se resuelve a claro/oscuro al guardar).
- [ ] **Auditoría completa** desde la página Configuración (hoy el toggle no persiste; la auditoría backend ya registra órdenes e inventario).
- [ ] **Paginación/filtros completos** en todas las tablas.
- [ ] Medir **cobertura de pruebas** (objetivo según `AGENTS.md`: ≥70% servicios, ≥50% controladores) con Jacoco y TestContainers (ya en el `pom.xml`).

### Prioridad baja / mejoras
- [ ] Internacionalización (**i18n**) — la opción de idioma en Configuración aún no tiene efecto.
- [ ] Revisar credenciales de prueba (sección 4) conforme evolucione la BD.
- [ ] Versionado **SemVer** con tags y releases en GitHub.

---

## 9. Referencias

- Directrices de arquitectura, seguridad y testing: **`AGENTS.md`** (raíz del repo).
- Migraciones de BD: `backend/voltios_y_ruedas/src/main/resources/db/migration/`.
- Config de proxy y caché: `frontend/nginx.conf`.
- Compose con healthchecks y volúmenes: `compose.yml`.
