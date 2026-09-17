# Matriz staging A1–C3 — pendiente de ejecución humana / Docker

**Estado:** no ejercida en las pasadas de código. Compose/Docker no estaba levantado. Marcar **solo** lo corrido a mano.

Viewports: `375` (A3/B3 según fila… ver columnas). Esta matriz cubre deep-link, logout y viewport por rol.

Usar con [[Checklist-revision]] y [[Alarmas]]. Hallazgos → coordinación.

## Leyenda

| Celda | Rol | Qué se ejerce |
|-------|-----|----------------|
| **Columna 1** | Deep-link por URL (no el menú) | Rutas ocultas → 403; home del rol OK |
| **Columna 2** | Logout | Sale a login/landing; no queda chrome ni persist observable |
| **Columna 3** | Viewport | A=375, B=768, C=1280 — acción primaria usable |

Filas: **A** `CLIENTE` · **B** `MECANICO` · **C** `ADMIN` o `JEFE_TALLER`

## Matriz (checklist)

| | **1. Deep-link** | **2. Logout** | **3. Viewport** |
|---|---|---|---|
| **A CLIENTE** | [ ] **A1** Login → `/mi-vehiculo` (nunca `/dashboard`). Pegar `/usuarios`, `/configuracion`, `/dashboard`, `/inventario` → **Acceso denegado**. `/mi-vehiculo` OK. Sin chrome staff (sidebar Dashboard/Órdenes). | [ ] **A2** Logout desde home cliente. Storage (`auth-storage`) vacío. No se puede volver con “atrás” a datos de sesión. Re-login pide credenciales. | [ ] **A3** `375`: home cliente (`/mi-vehiculo` / reservas) sin overflow que tape la acción primaria; tap usable. |
| **B MECANICO** | [ ] **B1** Login → `/dashboard`. `/usuarios` y `/configuracion` por URL → **403**. `/inventario`, `/ordenes`, `/reservas` OK. No abre `/mi-vehiculo`. | [ ] **B2** Logout desde dashboard/inventario. Persist limpio. Deep-link posterior a `/inventario` → `/login`. | [ ] **B3** `768`: inventario y órdenes usables (tabla o alternativa); no se pierde Guardar/Nuevo. |
| **C ADMIN o JEFE_TALLER** | [ ] **C1** Login → `/dashboard`. `/usuarios` y `/configuracion` OK. `/mi-vehiculo` → **403**. F5: Network muestra `GET /api/auth/me` y el rol no cambia a uno stale. | [ ] **C2** Logout. Swagger/sesión no reutiliza el JWT en UI. Volver a `/usuarios` → `/login`. | [ ] **C3** `1280`: layout desktop (sidebar + listados usuarios/inventario) coherente; acción primaria visible. |

## Cómo correrla (Docker)

1. `docker compose up -d --build` (o Vite + API local). App en `http://localhost`.
2. Un usuario real por fila (`CLIENTE`, `MECANICO`, `ADMIN` o `JEFE_TALLER`).
3. DevTools: Application → Session Storage (`auth-storage`) en A2/B2/C2; Network filtro `me` en C1.
4. Anotar pass/fail por celda. Lo no corrido se declara **no ejercido**.

## Fuera de esta matriz (no inflar)

- Import/Export de inventario (no hay endpoint).
- Tests WIP ajenos (reestablecer password / política de password).
- Backend filter chain (eso es Ciberseguridad / Thermos).

## Ejecucion smoke API (2026-09-16 Fury/Docker)

Stack: docker compose up -d --build OK. Solo puerto host **:80** (nginx). Postgres/Redis/app no publicados al host.
Flyway: V6 email_verificado fail-closed + V7 refresh hash **aplicadas**.

| Check | Resultado |
|-------|-----------|
| Frontend / | 200 |
| Register CLIENTE nuevo | 200, emailVerificado=false, ctivo=false |
| Login sin verificar email | **403** fail-closed (mensaje verificar correo) |
| Login tras marcar verificado en BD | 200 + access + refresh |
| GET /api/auth/me | 200 |
| POST /api/auth/refresh | 200 |
| CLIENTE GET /api/usuarios | denegado (401) |
| CLIENTE GET /api/inventario | denegado (401) |
| CLIENTE GET /api/ordenes | **403** |
| CLIENTE GET /api/reservas | **403** |
| CLIENTE mis-vehiculos | 200 |

**UI A1–C3 (deep-link browser / logout / viewports):** sigue **needs_validation** humana — no se abrio browser en esta pasada.
Usuario smoke creado: smoke.cliente@test.local (solo entorno local).
