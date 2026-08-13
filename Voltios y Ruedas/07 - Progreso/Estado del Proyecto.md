# Estado del Proyecto

> Resumen ejecutivo actualizado a **2026-08-12**. Fuente: `PROYECTO.md` y `CHANGELOG.md`.

## Qué es

Sistema de gestión para el taller automotriz **Voltios y Ruedas**:
- **Clientes**: registran vehículos, agenda/editan/cancelan reservas, ven historial de órdenes (diagnósticos, repuestos, costos).
- **Staff** (ADMIN / JEFE_TALLER / MECANICO): dashboard, reservas, órdenes, inventario, usuarios, configuración.

## Stack (resumen)

Monolito **Spring Boot 3.3.4 (Java 21) + React 19 (Vite) + PostgreSQL 16 + Redis 7**, todo en Docker Compose con healthchecks. Proxy: nginx. Túnel: ngrok (dominio estático). CI: GitHub Actions. Deploy posible en Render.

## Última sesión de trabajo (2026-08-12)

- **Cuenta pendiente (Opción A):** con SMTP habilitado el registro crea la cuenta con `activo=false` + `emailVerificado=false`; solo se activa al confirmar el código. Login bloqueado con `403 "Debes verificar tu correo..."` y refresh de tokens bloqueado para cuentas inactivas/sin verificar. Badge **Pendiente** en el panel de usuarios.
- **Edición de rol corregida:** el frontend envía `rol: { id }` (antes `rolId`, que el backend ignoraba) y `UsuarioService.crear` resuelve el rol. Además se arregló el fallo silencioso del formulario de edición (Zod exigía `password` que no se renderiza al editar); ahora `password` es opcional en `usuarioSchema` y se valida manualmente al crear.
- **Verificación de correo** (+`/verificar-email`), **notificaciones por email** (SMTP Gmail **activo**), **sesión por inactividad** (`sessionStorage` + timeout), **validación de teléfono CR** y límites de nombre/apellido.
- **Seguridad registrado**: eliminado `rolId` del registro público (escalada de privilegios).
- Stack Docker + ngrok **levantado** en `https://vocalist-wrongly-pedometer.ngrok-free.dev`.
- **Antecedentes** (sesiones previas): 5 mejoras de seguridad (validación, sesión, refresh tokens rotativos, rate limiting, verificación de email), código HTTP correctos, perfil/preferencias reales, notificaciones, auditoría, code-splitting (~97 kB gzip), correcciones de filtros (CAST :search), CORS por patrones, ReservaResponse, ojo de contraseña, tablas responsive.

## Verificación actual

| Componente | Estado |
|---|---|
| Backend unit tests (afectados) | ✅ Verde |
| `mvn test-compile` | ✅ |
| Build Docker backend | ✅ |
| Frontend `npm test` (30) | ✅ Verde |
| Frontend `npm run build` | ✅ |
| Docker stack + healthchecks | ✅ Healthy |
| ngrok URL pública | ✅ |
| Tests integración/controladores (H2) | ⚠️ Fallan preexistentes (ver [[05 - Testing/Pruebas del Backend]]) |

## Últimos commits

```
5ecc119 fix(ui): corregir filtros, responsividad de tablas y ojo de contraseña
a2b78f6 fix(reservas): devolver ReservaResponse para evitar HTTP 500 y corregir dashboard para clientes
f1fe268 fix(security): permitir CORS por patrones (same-origin detras de nginx/ngrok daba 403 en login)
905ff8f chore(ngrok): usar el dominio estatico reservado del plan free
4d61f15 feat(deploy): overlay ngrok para exponer el frontend local con URL publica
```

Volver a [[Home]].