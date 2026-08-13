# Correcciones Recientes

> Detalle de los arreglos más relevantes (últimas sesiones). Actualizado 2026-08-12.

## Sesión más reciente (cuenta pendiente + edición de rol)

### Cuenta pendiente hasta verificar (Opción A)
- Con `MAIL_ENABLED=true` el registro crea la cuenta **pendiente**: `activo=false` + `emailVerificado=false`.
- Solo al confirmar el código (`POST /api/auth/verificar-email`) la cuenta se **activa** (ambos `true`).
- Login de cuenta pendiente → `403 "Debes verificar tu correo electrónico..."` (se maneja `DisabledException` en `AuthService.login`).
- El refresh de tokens se **bloquea** para cuentas inactivas o sin verificar (`AuthService.refrescarToken`).
- Panel de usuarios: badge **Pendiente** (warning) cuando `emailVerificado=false` (`UsuariosPage.tsx`).
- En dev (`MAIL_ENABLED=false`) la cuenta queda activa y verificada de inmediato.

### Edición de rol en el panel de administración
- **Causa raíz (backend):** el frontend enviaba `rolId` (número) pero el backend esperaba un objeto `rol` (`UsuarioService.actualizar`), por lo que el rol nunca cambiaba. Ahora el frontend envía `rol: { id }` (`usuarioService.ts`) y `UsuarioService.crear` resuelve el rol desde el request.
- **Causa raíz (frontend, "ni error ni se actualiza"):** `usuarioSchema` extendía `registerSchema` que **exigía `password`**, pero al editar el campo no se renderiza → `password` quedaba `undefined` y `handleSubmit` **nunca ejecutaba `onSubmit`** (fallo silencioso). Ahora `password` es **opcional** en `usuarioSchema` y se valida manualmente al crear (`UsuariosPage.tsx`).
- `actualizar` ya no nulea `activo` cuando el campo no viene en el JSON.

### Verificado (2026-08-12, stack Docker)
- Registro → `activo=false` → login `403` → verificar con código de Redis → login OK.
- `PUT /api/usuarios/{id}` con `rol: {id:3}` → CLIENTE → MECANICO.

## Sesión anterior (SMTP + verificación de email)

### Agregado
- **Verificación de correo**: código 6 dígitos vía SMTP, columnas `email_verificado` (V5), endpoints `/verificar-email` y `/reenviar-codigo`, página `/verificar-email`. En dev (`MAIL_ENABLED=false`) la cuenta queda verificada.
- **Notificaciones por email**: aviso de cita al jefe, cambio de estado de orden al cliente, estado "trabajando".
- **Sesión por inactividad** (frontend): timeout default 60 min; pestaña oculta > límite → cierre; `sessionStorage` para la sesión.
- **Validación de teléfono CR** (Zod + backend) y límites 2–50 en nombre/apellido.

### Corregido
- **Registro público**: eliminado `rolId` de `RegisterRequest`; siempre rol `CLIENTE` (Seguridad).
- **Errores legibles**: interceptor Axios propaga `mensaje` del backend (nada de "Request failed...").

## Sesión anterior

### Correcciones backend
- `POST /api/reservas` devolvía `HTTP 500` por proxy lazy → ahora DTO `ReservaResponse`.
- Dashboard para CLIENTE no llama más a `/api/inventario/stock-bajo` (401 al cliente).
- Filtros: `GET /api/usuarios` acepta `search` y `rol` (con debounce en frontend).
- Filtros PostgreSQL: `CAST(:search AS string)` en `UsuarioRepository` y `ReservaRepository` (fix `lower(bytea)`).
- CORS por **patrones** (`allowedOriginPatterns`) → login detrás de nginx/ngrok dejó de dar 403.

### Correcciones frontend
- Tablas responsive (tarjetas en < md).
- Filtros: reset a página 1 y corrección si página > total.
- `Select` con `leftIcon` y chevrón propio (icono no se superponía).
- Botón ojo de contraseña funcional (`pointer-events-none` eliminado): perfil, configuración, creación de usuarios.

## Sesiones previas (contexto de seguridad)

- Refresh tokens rotativos con detección de **reuso** (V4) y códigos HTTP correctos (401/403/409).
- Validación estricta (nombre solo letras, email robusto) en entidad + DTOs + Zod.
- Logout con blacklist + revocación de refresh.
- Perfil/Configuración conectados al backend real (perfil, tema, idioma, zona horaria, notificaciones, contraseña).
- Notificaciones reales en el header.
- Dashboard sin datos simulados, con navegación funcional.
- Code-splitting con `React.lazy` + `Suspense`.

## Errores que ya NO existen

| Error histórico | Estado |
|---|---|
| `cliente@test.com` no existe en BD | Documentado (no crear) |
| Página register en blanco (`dark:bg-surface-950`) | Corregido → `surface-900` |
| `vehiculoService.ts` sin `/api/` (CRUD cliente crasheaba) | Corregido |
| Chunk > 500 kB | Corregido con code-splitting |
| Perfil no se guardaba (teléfono `""`) | Corregido con `PATTERN_TELEFONO` |
| `JwtUtil.validateToken` lanzaba con token inválido | Corregido (try/catch → false) |
| Contenedor unhealthy por SMTP inválido | Corregido (`management.health.mail.enabled=false`) |
| Editar rol en usuarios "no hacía nada ni daba error" | Corregido: payload `rol: { id }` + `password` opcional en Zod (ya no silencioso) |
| Registro creaba cuentas activas sin verificar | Corregido (Opción A): pendiente hasta confirmar código |

Volver a [[Home]].