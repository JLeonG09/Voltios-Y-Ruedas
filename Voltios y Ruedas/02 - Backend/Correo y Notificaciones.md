# Correo y Notificaciones

> Notificaciones en panel (BD) + envío de correos SMTP.

## MailService (`notificaciones/service/MailService.java`)

- Usa `spring-boot-starter-mail` (JavaMailSender).
- Configuración: `application.properties` ([[04 - DevOps/Entorno y Variables|ver variables]]).
- Si `app.mail.enabled=false` o no hay host: los correos **se registran por consola** en dev y no se envían.
- `management.health.mail.enabled=false` → credenciales SMTP inválidas **no** marcan el contenedor unhealthy (el fallo se loguea y continúa).

### Mensajes enviados

| Mensaje | Endpoint que lo dispara |
|---|---|
| Código de verificación (6 dígitos) | `/api/auth/register`, `/api/auth/reenviar-codigo` |
| Aviso de agenda (cita) al jefe de taller | `POST /api/reservas` |
| Cambio de estado de orden al cliente | `PUT /api/ordenes/{id}/estado` |
| Estado "trabajando" a jefe de taller y cliente | igual que el anterior |
| Recuperación de contraseña (token con enlace) | `POST /api/auth/recuperar-password` |

### Recuperación de contraseña por correo

- `enviarRecuperacionPassword(email, token)` envía HTML con enlace `{app.frontend.url}/reestablecer-password?token=...`.
- `app.frontend.url` se configura con la variable `FRONTEND_URL` (default `http://localhost:5173`) en `application.properties`, `compose.yml` y `.env.example`.
- En producción (`MAIL_ENABLED=true`) `iniciarRecuperacion` envía el correo y devuelve `null` (respuesta genérica); en dev devuelve el token en la respuesta.

## Notificaciones en panel (`NotificacionService`)

- Entidad `Notificacion`: usuario, título, mensaje, tipo, leída, fecha.
- Se crean en:
  - `POST /api/reservas` → notifica a staff ("Nueva reserva").
  - `PUT /api/ordenes/{id}/estado` y creación/actualización de órdenes → notifica al cliente.
  - Inventario con stock bajo → notifica a staff.
- Endpoints: `GET /api/notificaciones`, `/no-leidas`, `PUT /{id}/leida`, `PUT /leer-todas`.

## Verificación de correo (`EmailVerificationService`)

- Genera código de 6 dígitos (`SecureRandom`).
- Guarda en Redis con clave `verif:{email}` y TTL **30 minutos**.
- `verificar(email, codigo)`: compara, marca `emailVerificado=true` **y `activo=true`** (activa la cuenta pendiente), elimina la clave Redis.
- `reenviarCodigo`: rechaza si ya está verificado; reenvía.
- Independientemente del SMTP, en **modo dev** (`MAIL_ENABLED=false`) la cuenta queda activa y verificada automáticamente al registrarse (para no bloquear el login).
- Con SMTP habilitado (`MAIL_ENABLED=true`, producción) el registro crea la cuenta **pendiente** (`activo=false`) hasta confirmar el código.

## Flujo en el frontend

1. `RegisterPage` → si `emailVerificado === false`, redirige a `/verificar-email`.
2. `VerificarEmailPage` → `authService.verificarEmail`, con enlace "Reenviar código".
3. `LoginPage` → si el backend responde "Debes verificar tu correo", redirige al flujo de verificación.

Volver a [[Home]].