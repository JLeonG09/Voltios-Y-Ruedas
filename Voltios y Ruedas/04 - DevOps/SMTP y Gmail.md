# SMTP y Gmail

> Envío de correos con Gmail como proveedor SMTP.

## Configuración

En `application.properties` (defaults para Gmail):

```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME:}
spring.mail.password=${MAIL_PASSWORD:}
spring.mail.protocol=smtp
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
app.mail.enabled=${MAIL_ENABLED:false}
app.mail.from=${MAIL_FROM:${MAIL_USERNAME:no-reply@voltiosyruedas.com}}
```

## Modos

| Modo | MAIL_ENABLED | Comportamiento |
|---|---|---|
| **Desarrollo** | `false` | Correos **registrados por consola**, no se envían; cuentas quedan activas y verificadas al registrarse |
| **Producción** | `true` | Envío real por SMTP de Gmail; el registro crea la cuenta **pendiente** (`activo=false`) hasta verificar |

> **Estado actual (2026-08-12):** `MAIL_ENABLED=true` con Gmail `voltiosyruedas@gmail.com` + App Password. Envío real **verificado** (registro de prueba recibió el código). 

> **Truco `MAIL_FROM`:** `compose.yml` pasaba `MAIL_FROM: ${MAIL_FROM:-}` (string vacío) → `app.mail.from=""` → `setFrom("")` lanzaba `Illegal address`. Corregido con fallback: `MAIL_FROM: ${MAIL_FROM:-${MAIL_USERNAME:-no-reply@voltiosyruedas.com}}`. En `.env` se definió `MAIL_FROM=voltiosyruedas@gmail.com`.

## Pasos para activar (Gmail)

1. Activar **verificación en dos pasos (2FA)** en la cuenta Gmail.
2. Crear una **Contraseña de aplicación (App Password)**:
   - Ir a https://myaccount.google.com/apppasswords
   - Elegir "Correo" + tu dispositivo → genera un código de 16 caracteres.
   - **NO** usar la contraseña normal de Gmail.
3. Poner en `.env`:
   ```
   MAIL_ENABLED=true
   MAIL_USERNAME=tu@cuenta.gmail.com
   MAIL_PASSWORD=<app-password>
   ```
4. Reconstruir la app: `docker compose up -d --build app`.

## Correos enviados

Ver [[02 - Backend/Correo y Notificaciones|Correo y Notificaciones]].

## Troubleshooting

| Problema | Causa/solución |
|---|---|
| `535 5.7.8 Username and Password not accepted` | App Password incorrecta o 2FA no activada |
| Contenedor `unhealthy` con SMTP mal configurado | Solucionado con `management.health.mail.enabled=false`; el error solo queda en logs |
| Correos no llegan en dev | Esperado: `MAIL_ENABLED=false` → log por consola |

Ver también: [[04 - DevOps/Entorno y Variables|Entorno y Variables]].

Volver a [[Home]].