# Entorno y Variables

> Configuración por variables de entorno. Archivos: `.env` (NO versionado), `.env.example` (documentado).

## Variables del proyecto

| Variable | Default | Descripción |
|---|---|---|
| `POSTGRES_USER` | `postgres` | Usuario BD |
| `POSTGRES_PASSWORD` | `password123` | Contraseña BD |
| `JWT_SECRET` | — | Secreto JWT (≥32 car, idealmente 64; `openssl rand -base64 64`) |
| `JWT_EXPIRATION` | `86400000` | Access token (24 h, ms) |
| `TZ` | `America/Costa_Rica` | Zona horaria |
| `SPRING_PROFILES_ACTIVE` | `dev` | Perfil Spring |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,...` | Orígenes CORS |
| `NGROK_AUTHTOKEN` | — | Token de ngrok (cuenta free) |
| `MAIL_ENABLED` | `false` | Activa envío de correos SMTP |
| `MAIL_HOST` | `smtp.gmail.com` | Host SMTP |
| `MAIL_PORT` | `587` | Puerto SMTP |
| `MAIL_USERNAME` | — | Cuenta Gmail completa (`tu@gmail.com`) |
| `MAIL_PASSWORD` | — | **App Password** de Google (NO tu contraseña normal) |
| `MAIL_FROM` | `MAIL_USERNAME` | Remitente de los correos |

## Configuración clave en `application.properties`

- `server.port=${PORT:8080}` → Render inyecta `PORT`.
- `app.cors.allowed-origins=${CORS_ALLOWED_ORIGINS:*}`.
- `spring.jpa.hibernate.ddl-auto=validate` → esquema por Flyway.
- `jwt.secret=${JWT_SECRET:...}`, `jwt.refresh.expiration=${JWT_REFRESH_EXPIRATION:604800000}` (7 días).
- Redis: `spring.data.redis.host=${REDIS_HOST:localhost}`.
- SMTP: defaults Gmail con STARTTLS obligatorio (`mail.smtp.starttls.required=true`).
- `app.mail.from=${MAIL_FROM:${MAIL_USERNAME:no-reply@voltiosyruedas.com}}`.
- `management.health.mail.enabled=false` → SMTP con credenciales inválidas no marca unhealthy.

## Seguridad

- `.env` está en `.gitignore`; usar `.env.example` para documentar.
- **JWT_SECRET obligatorio** en producción (el default solo vale para dev).
- Nunca commitear tokens ni App Passwords.

## Para activar correos reales

1. Activar **verificación en dos pasos (2FA)** en la cuenta Gmail.
2. Crear una **App Password** en https://myaccount.google.com/apppasswords.
3. En `.env`:
   ```
   MAIL_ENABLED=true
   MAIL_USERNAME=cuenta@gmail.com
   MAIL_PASSWORD=la-app-password
   ```
4. Recargar el stack: `docker compose up -d --build app`.

Ver también: [[04 - DevOps/SMTP y Gmail|SMTP y Gmail]].

Volver a [[Home]].