# API Endpoints

> Documentación de los endpoints REST del backend. Swagger disponible en `http://localhost/swagger-ui/`.

## Autenticación — `/api/auth` (público excepto donde se indica)

| Método | Ruta | Descripción | Autenticado |
|---|---|---|---|
| POST | `/api/auth/register` | Registra usuario (rol SIEMPRE `CLIENTE`) | No |
| POST | `/api/auth/verificar-email` | Valida código 6 dígitos | No |
| POST | `/api/auth/reenviar-codigo` | Envía nuevo código | No |
| POST | `/api/auth/login` | Login → access + refresh token | No |
| POST | `/api/auth/refresh` | Rota refresh token → nuevo par | No |
| POST | `/api/auth/logout` | Blacklist token + revoca refresh | Sí |
| POST | `/api/auth/recuperar-password` | Envía token de recuperación por correo (prod); en dev lo devuelve en la respuesta | No |
| POST | `/api/auth/reestablecer-password` | Restablece usando token | No |
| PUT | `/api/auth/me` | Actualiza perfil propio | Sí |
| GET | `/api/auth/me` | Obtiene usuario autenticado | Sí |
| GET/PUT | `/api/auth/preferencias` | Preferencias (tema, idioma, sesión...) | Sí |
| PUT | `/api/auth/me/password` | Cambia contraseña autenticado | Sí |

## Usuarios — `/api/usuarios`

| Método | Ruta | Roles |
|---|---|---|
| GET | `/api/usuarios` | ADMIN, JEFE_TALLER (filtros `search`, `rol`, paginado) |
| GET | `/api/usuarios/todos` | ADMIN, JEFE_TALLER |
| GET | `/api/usuarios/mecanicos` | ADMIN, JEFE_TALLER |
| GET | `/api/usuarios/{id}` | ADMIN, JEFE_TALLER |
| POST | `/api/usuarios` | ADMIN (payload con `rol: { id }`; si falta → error 400) |
| PUT | `/api/usuarios/{id}` | ADMIN (payload con `rol: { id }`; `activo` opcional, no se nulea si se omite) |
| PUT | `/api/usuarios/{id}/password` | ADMIN o propietario |
| DELETE | `/api/usuarios/{id}` | ADMIN |
| GET | `/api/usuarios/me` | Autenticado |

## Reservas — `/api/reservas`

| Método | Ruta | Roles |
|---|---|---|
| GET | `/api/reservas` | ADMIN, JEFE_TALLER, MECANICO (filtros `search`, `estado`, paginado) |
| GET | `/api/reservas/mis-reservas` | Todos los roles (cliente ve las suyas) |
| GET | `/api/reservas/fecha?inicio&fin` | ADMIN, JEFE_TALLER, MECANICO |
| GET | `/api/reservas/{id}` | Todos (verifica propiedad si es cliente) |
| POST | `/api/reservas` | Cliente crea para sí; staff para cualquiera |
| PUT | `/api/reservas/{id}` | Staff o dueño (no en CANCELADA/COMPLETADA) |
| PUT | `/api/reservas/{id}/estado?estado=` | ADMIN, JEFE_TALLER, MECANICO |
| PUT | `/api/reservas/{id}/cancelar` | Dueño o staff |
| DELETE | `/api/reservas/{id}` | ADMIN, JEFE_TALLER |

## Órdenes de trabajo — `/api/ordenes`

| Método | Ruta | Roles |
|---|---|---|
| GET | `/api/ordenes` | ADMIN, JEFE_TALLER, MECANICO (paginado) |
| GET | `/api/ordenes/mis-ordenes` | Cliente (las suyas) |
| GET | `/api/ordenes/mi-historial` | Cliente (con bitácora y facturación) |
| GET | `/api/ordenes/mecanico/{id}` | ADMIN, JEFE_TALLER, MECANICO |
| GET | `/api/ordenes/estado/{estado}` | ADMIN, JEFE_TALLER, MECANICO |
| GET | `/api/ordenes/historial` | ADMIN, JEFE_TALLER (facturación/reportes) |
| GET | `/api/ordenes/{id}` | Todos (cliente solo si es dueño) |
| GET | `/api/ordenes/numero/{numeroOrden}` | Todos (cliente solo si es dueño) |
| GET | `/api/ordenes/{id}/bitacora` | Todos (cliente solo si es dueño) |
| POST | `/api/ordenes` | ADMIN, JEFE_TALLER, MECANICO |
| PUT | `/api/ordenes/{id}` | ADMIN, JEFE_TALLER, MECANICO |
| PUT | `/api/ordenes/{id}/estado?estado=` | ADMIN, JEFE_TALLER, MECANICO |
| DELETE | `/api/ordenes/{id}` | ADMIN |
| POST | `/api/ordenes/{id}/repuestos` | ADMIN, JEFE_TALLER, MECANICO |
| DELETE | `/api/ordenes/{id}/repuestos/{inventarioId}` | ADMIN, JEFE_TALLER, MECANICO |

## Vehículos — `/api/vehiculos`

| Método | Ruta | Roles |
|---|---|---|
| GET | `/api/vehiculos` | ADMIN, JEFE_TALLER, MECANICO |
| GET | `/api/vehiculos/mis-vehiculos` | Cliente (los suyos) |
| GET | `/api/vehiculos/{id}` | Todos (cliente solo si es dueño) |
| GET | `/api/vehiculos/placa/{placa}` | ADMIN, JEFE_TALLER, MECANICO |
| POST | `/api/vehiculos` | Todos (cliente crea para sí) |
| PUT | `/api/vehiculos/{id}` | Staff o dueño |
| PUT | `/api/vehiculos/{id}/estado?estado=` | ADMIN, JEFE_TALLER, MECANICO |
| DELETE | `/api/vehiculos/{id}` | ADMIN |

## Inventario — `/api/inventario`

| Método | Ruta | Roles |
|---|---|---|
| GET | `/api/inventario` | Según SecurityConfig (paginado) |
| GET | `/api/inventario/activos` | Ídem |
| GET | `/api/inventario/categoria/{categoria}` | Ídem |
| GET | `/api/inventario/stock-bajo` | Ídem (devuelve repuestos con stock bajo) |
| GET | `/api/inventario/{id}` | Ídem |
| GET | `/api/inventario/codigo/{codigo}` | Ídem |
| POST | `/api/inventario` | ADMIN, JEFE_TALLER |
| PUT | `/api/inventario/{id}` | ADMIN, JEFE_TALLER |
| PUT | `/api/inventario/{id}/stock?cantidad=` | ADMIN, JEFE_TALLER, MECANICO |
| DELETE | `/api/inventario/{id}` | ADMIN |

> Nota: los GET de inventario dependen de la regla `SecurityConfig` (staff) aunque no lleven `@PreAuthorize`.

## Notificaciones — `/api/notificaciones`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/notificaciones` | Lista las del usuario |
| GET | `/api/notificaciones/no-leidas` | Conteo de no leídas |
| PUT | `/api/notificaciones/{id}/leida` | Marca una leída |
| PUT | `/api/notificaciones/leer-todas` | Marca todas leídas |

## Auditoría — `/api/auditoria`

| Método | Ruta | Roles |
|---|---|---|
| GET | `/api/auditoria` | ADMIN, JEFE_TALLER (paginado) |

---

## Formato de respuesta de error

```json
{
  "código": "VALIDATION_ERROR",
  "mensaje": "El email ya está registrado",
  "detalles": ["Campo 'email' no es válido"],
  "timestamp": "2026-08-10T15:30:45Z",
  "path": "/api/auth/register"
}
```

Códigos HTTP: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 429 Too Many Requests, 500 Server Error.

## Seguridad de rutas

- `/api/auth/**` → público
- `/actuator/health`, `/actuator/info` → público
- `/v3/api-docs/**`, `/swagger-ui/**` → público
- `/api/usuarios/**` → ADMIN, JEFE_TALLER
- `/api/auditoria/**` → ADMIN, JEFE_TALLER
- `/api/inventario/**` → ADMIN, JEFE_TALLER, MECANICO
- `/api/reservas/**`, `/api/ordenes/**`, `/api/vehiculos/**`, `/api/notificaciones/**` → todos los roles
- Cualquier otra ruta → autenticado

Ver también: [[02 - Backend/Seguridad|Seguridad]].

Volver a [[Home]].