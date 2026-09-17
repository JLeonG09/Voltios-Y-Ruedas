# Checklist de revisión (pre-merge) — QA · Voltios y Ruedas

Usar en cada PR / entrega que toque UI o flujo. Marcar solo lo **ejercido**. Lo no ejercido se declara explícitamente.

**Viewports objetivo:** `375` / `768` / `1280`.

**Flujos canónicos a ejercer cuando el diff los toque:**

1. Login / sesión (roles)
2. Reservas de **cliente**
3. Órdenes de taller (**staff**: JEFE_TALLER / MECANICO / ADMIN)
4. Inventario

Hallazgos → coordinación del proyecto (Fury / lead).

## Antes de empezar

- [ ] Leí el criterio de aceptación / ticket
- [ ] Identifiqué pantallas y flujos tocados por el diff
- [ ] Revisé `docs/second-brain/` y convenciones del repo
- [ ] Entorno y datos de prueba listos (o anoté bloqueo) — Compose local si aplica

## Authz, sesión y fallos de UI (P0)

Ejercer cuando el diff toca router, menú, persist de auth o layout root:

- [ ] Deep-link por rol (no alcanza el menú): `MECANICO`/`CLIENTE` → `/usuarios` y `/configuracion` = 403 o redirect, **no** el contenido
- [ ] `CLIENTE` no abre staff (`/dashboard`, `/inventario`, …); staff no abre `/mi-vehiculo` / `/mis-reservas` / `/mi-historial`
- [ ] Roles usados: `ADMIN` · `JEFE_TALLER` · `MECANICO` · `CLIENTE` (strings exactos del backend)
- [ ] Tras F5 / nueva pestaña: el rol sale de `GET /api/auth/me`, no del persist stale
- [ ] Login CLIENTE → `/mi-vehiculo` (sin pasar por `/dashboard` ni chrome staff)
- [ ] MainLayout sin sesión / sin user → `/login` (no Outlet a medias)
- [ ] Crash simulado de página: fallback visible + **Reintentar** (no pantalla blanca)
- [ ] Matriz staging **A1–C3** (deep-link / logout / viewports): [[Matriz-staging]] — pendiente hasta ejecución humana/Docker

## Flujo y estados

- [ ] Happy path de punta a punta del flujo tocado
- [ ] Cancelar / atrás / refresh a mitad de flujo
- [ ] Doble submit / acción repetida (reservas, órdenes, stock)
- [ ] Loading visible y finito
- [ ] Empty state con siguiente paso claro
- [ ] Error recuperable (mensaje + acción)
- [ ] Éxito observable (feedback + dato persistido si aplica)
- [ ] UI alineada con backend tras error o retry

## Regresión y vecinos

- [ ] Smoke del módulo afectado (auth / reservas / taller / vehiculo / inventario)
- [ ] Flujos vecinos del mismo recurso
- [ ] Auth / sesión / rol si el diff la toca
- [ ] No hay callejón sin salida nuevo

## Accesibilidad y teclado

- [ ] Recorrido completo solo con teclado
- [ ] Foco visible en controles interactivos
- [ ] Modal/drawer: focus trap y Escape
- [ ] Labels / nombres accesibles en controles nuevos
- [ ] Contraste de texto y de acción primaria (AA)
- [ ] Mensajes de error anunciables / asociados al campo

## Responsive (375 / 768 / 1280)

- [ ] 375: sin overflow horizontal crítico; acción primaria usable
- [ ] 768: formularios/tablas de taller e inventario usables
- [ ] 1280: layout desktop coherente
- [ ] Controles usables (tamaño / spacing) en touch

## Mirada al diff (coordinación con Thermos, no subordinación)

- [ ] Superficie de riesgo del patch identificada
- [ ] Ramas de estado nuevas tienen UI
- [ ] Errores no se quedan solo en consola
- [ ] Copy coherente; sin stack técnico al usuario
- [ ] Riesgo de test ausente anotado si el comportamiento cambió
- [ ] Hallazgos de uso listos para contrastar con Thermos (`docs/second-brain/Thermos/`)

## Criterios y cierre

- [ ] Cada criterio de aceptación tiene resultado ejercido (pass/fail)
- [ ] Hallazgos clasificados: bloqueante / importante / detalle
- [ ] Bloqueantes re-verificados tras fix (o PR no listo)
- [ ] Lista de “no ejercido” entregada a coordinación si aplica

## Decisión QA

- [ ] **Listo para merge desde QA** (sin bloqueantes abiertos; importantes acordados)
- [ ] **No listo desde QA** (motivo en una línea + enlace a hallazgos)

Nota: el sí de Thermos u otro pilar no reemplaza esta decisión.

Firma mental: *no apruebo lo que no ejercí*.
