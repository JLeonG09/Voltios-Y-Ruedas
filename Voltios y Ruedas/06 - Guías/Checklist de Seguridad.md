# Checklist de Seguridad

> Chequeo pre-deploy y revisiones periódicas. Derivado de `AGENTS.md`.

## Al desplegar a producción

- [ ] Todos los tests que deben pasar, pasan.
- [ ] Sin credenciales hardcodeadas (`grep -r "password\|secret\|key"`).
- [ ] `JWT_SECRET` ≥ 32 caracteres, aleatorio, solo en entorno.
- [ ] HTTPS/TLS (ngrok o Render).
- [ ] Cabeceras de seguridad presentes (HSTS, X-Frame-Options, CSP, X-Content-Type-Options).
- [ ] Rate limiting en `/api/auth/login` activo.
- [ ] Migraciones Flyway validadas.
- [ ] Respuestas de error sin stack traces.
- [ ] CHANGELOG actualizado.
- [ ] Backup de BD.

## Ya implementado en el código

| Control | Ubicación |
|---|---|
| BCrypt factor 12 | `SecurityConfig` |
| JWT HS512, secret desde env | `application.properties`, `JwtUtil` |
| Refresh tokens rotativos + reuso | V4, `AuthService` |
| Blacklist de tokens en Redis | `TokenBlacklistService` |
| Rate limiting (Bucket4j) | `RateLimitingFilter` |
| Headers de seguridad | `SecurityConfig` |
| Errores sin info interna | `GlobalExceptionHandler`, `ErrorResponse` |
| Validación estricta backend + frontend | DTOs, entidades, Zod |
| Registro público con rol forzado CLIENTE | `AuthService.registrar` |
| `password` no expuesto en DTO | `UsuarioResponse` (WRITE_ONLY) |
| Sesión atada a la pestaña (`sessionStorage`) | `authStore` |
| Timeout por inactividad | `useSessionTimeout` |
| Verificación de email | `EmailVerificationService` |

## Pendiente / mejoras sugeridas

- [ ] Endpoint de recuperación de contraseña en producción enviando por correo (hoy devuelve el token en dev).
- [ ] Revisar exposición del hash de password en listados (histórico).
- [ ] Persistir preferencias de configuración y auditoría real.
- [ ] Corregir tests de integración (seed de roles).

Ver también: [[02 - Backend/Seguridad|Seguridad]], [[07 - Progreso/Tareas Pendientes|Tareas Pendientes]].

Volver a [[Home]].