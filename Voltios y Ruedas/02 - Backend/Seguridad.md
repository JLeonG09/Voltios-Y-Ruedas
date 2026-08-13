# Seguridad

> Autenticación, autorización, validación y manejo de errores del backend. Resumen ejecutivo del flujo en [[01 - Arquitectura/Flujo de Autenticación|Flujo de Autenticación]].

## Reglas de oro (AGENTS.md)

- **Nunca** commitear: `.env`, credenciales, JWT_SECRET, claves API.
- Código, mensajes y respuestas en **español**.
- `camelCase` para variables/JSON; `PascalCase` clases/interfaces; `SCREAMING_SNAKE_CASE` constantes.
- **Monolito modular**: prohibidas llamadas HTTP internas entre módulos.

## Configuración de Security (`SecurityConfig`)

- CSRF desactivado (API stateless con JWT).
- CORS con patrones desde `app.cors.allowed-origins` (default `*`; incluye `ngrok-skip-browser-warning`).
- Sesiones `STATELESS`.
- JWT + RateLimiting filters registrados antes de `UsernamePasswordAuthenticationFilter`.
- Headers de seguridad:
  - `Strict-Transport-Security` (max-age 31536000, includeSubDomains)
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Content-Security-Policy` (default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none')
  - `Referrer-Policy: same-origin`
  - `X-Content-Type-Options: nosniff` (implícito por frameOptions)

## JWT

- Firmado HS512 con `jwt.secret` (desde env `JWT_SECRET`, mínimo 32 caracteres).
- Claims: email (subject), rol, `jti` (único para refresh), expiración.
- `JwtUtil.validateToken` captura excepciones y devuelve `false` (token expirado/malformado) en lugar de lanzar.
- `JwtAuthenticationFilter`: extrae Bearer, valida, carga usuario → contexto.
- **Blacklist** en Redis (`blacklist:{token}`) con TTL igual a la expiración del access token.

## Refresh tokens (V4)

- Tabla `refresh_tokens` (token hash, usuario, expiración, revocado).
- **Rotación**: cada refresh revoca el usado y emite uno nuevo (claim `jti` único).
- **Detección de reuso**: si un token ya rotado se reutiliza → se revoca toda la familia y se rechaza.
- **Logout** revoca los refresh tokens activos del usuario.

## Rate limiting

- `RateLimitingFilter`: **5 intentos/min** en `/api/auth/login` (Bucket4j), responde `429`.

## Contraseñas y validación

- **BCrypt factor 12** (`new BCryptPasswordEncoder(12)`).
- Validación estricta:
  - `@NotBlank`, `@Size`, `@Email`, `@Pattern` en entity + DTOs.
  - nombre/apellido: 2–50 caracteres, solo letras (acentos/ñ ok).
  - email: local ≥2, dominio ≥2, TLD ≥2 letras.
  - teléfono CR: `^(|(\+506[ -]?)?\d{4}[ -]?\d{4})$` (vacío permitido).
- `@Valid` en todos los `@RequestBody`.

## Manejo de errores (`GlobalExceptionHandler`)

| Excepción | HTTP |
|---|---|
| `MethodArgumentNotValidException` | 400 |
| `DataIntegrityViolationException` | 409 |
| `AccessDeniedException` | 403 |
| `EntityNotFoundException`/`ApiException.notFound` | 404 |
| `ApiException.badRequest`, login inválido | 400/401 |
| Genéricas | 500 (loguear, sin filtrar stack traces) |

## Registro público seguro

- **`rolId` eliminado de `RegisterRequest`**: `/api/auth/register` asigna **siempre** `CLIENTE`.
- Se previene escalada de privilegios (antes el cliente podía enviar `rolId` de ADMIN).
- Al guardar usuario se valida vía Bean Validation de la entidad (cierra el hueco de `POST/PUT /api/usuarios`).

## Cuenta pendiente hasta verificar

- Con `MAIL_ENABLED=true` el registro crea la cuenta con `activo=false` + `emailVerificado=false` (Opción A).
- `EmailVerificationService.verificar` activa ambos al confirmar el código.
- `AuthService.login` captura `DisabledException` (cuenta desactivada) y devuelve `403` con mensaje específico: verificar correo si no está verificado, o "cuenta inactiva" si fue desactivada por un admin.
- `AuthService.refrescarToken` **bloquea** la renovación si la cuenta está inactiva o sin verificar.

## Edición de roles (gestión de usuarios)

- El frontend envía `rol: { id }` (objeto) en `POST/PUT /api/usuarios`; el backend resuelve el rol a una entidad gestionada vía `rolRepository.findById` (rechaza ids inexistentes con `400`).
- `UsuarioService.actualizar` solo actualiza `activo` si el campo viene en el JSON (no nulea el valor actual).
- El registro público ignora cualquier `rol` recibido (siempre `CLIENTE`).

## Auditoría

- `AuditService.registrar(...)` en cambios de contraseña, órdenes, inventario, reservas, auth (login/logout/verificar email).
- Ver [[02 - Backend/Base de Datos y Migraciones|Base de Datos y Migraciones]] para la tabla `auditoria`.

Volver a [[Home]].