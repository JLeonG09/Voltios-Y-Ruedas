# Alarmas (QA) — Voltios y Ruedas

Si ves esto, pará y tratá como **importante** o **bloqueante** hasta probarlo. No son “detalles”.

## Flujo y datos (taller)

- Spinner que no termina / pantalla en blanco tras login, reserva, orden o movimiento de stock.
- Botón primario sin feedback al clickear.
- Doble submit crea dos reservas, dos órdenes o descuenta inventario dos veces.
- Tras error, la UI dice éxito (o al revés).
- Refresh o “atrás” deja estado huérfano o pierde datos no guardados sin aviso.
- Borrar vehículo / orden / ítem de inventario sin confirmación clara.

## Auth y sesión

- Sesión caducada (JWT / blacklist Redis) deja al usuario en callejón sin salida.
- Rutas de staff visibles o accionables como `CLIENTE` (y viceversa).
- **RBAC solo en Sidebar:** deep-link a `/usuarios`, `/configuracion` (u otras ocultas) abre la página para `MECANICO` / `CLIENTE`. El router debe 403 o redirigir.
- Logout no limpia datos sensibles en pantalla o storage observable.
- Hidratar sesión desde persist (`sessionStorage` / Zustand) **sin** `GET /api/auth/me`: el rol stale manda en los guards.
- Login de `CLIENTE` a `/dashboard` (flash de chrome staff o 403). El destino es `/mi-vehiculo`.
- MainLayout con `!auth` o `!user` pinta el Outlet a medias en vez de ir a `/login`.
- Crash de página → pantalla blanca (no hay `ErrorBoundary` en root con fallback + Reintentar).

## Formularios y errores

- Validación solo en cliente o solo en server, con mensajes contradictorios.
- Error técnico crudo al usuario (stack, SQL, “undefined”).
- Campo inválido sin marca ni foco; toast genérico lejos del problema.

## Accesibilidad y teclado

- No se puede completar login / reserva / orden solo con teclado.
- Modal sin Escape / foco se pierde detrás del overlay.
- Contraste que impide leer la acción crítica.
- Controles solo-icono sin nombre accesible en acciones destructivas.

## Responsive (375 / 768 / 1280)

- Overflow horizontal que tapa la acción primaria en 375.
- Hit target imposible en touch para guardar/enviar.
- Tabla de inventario u órdenes que corta pasos sin alternativa en móvil.

## Diff / regresión

- Se tocó auth, roles, reservas, órdenes o inventario y no hay smoke ejercido.
- Se eliminaron empty/error/loading states en el patch.
- “Funciona en mi máquina” sin pasos ni ambiente anotado.
- Criterio de aceptación no ejercido pero el PR pide merge.

## Falsas alarmas (no inflar)

- Microcopy imperfecto con sentido claro → detalle.
- Pixel misalignment menor sin tapar acción → detalle.
- Warning de consola de terceros sin impacto de usuario → anotar, no bloquear salvo que rompa el flujo.

## Voltios-Ruedas (2026-09-16) — post fixes codigo
- Deep-link != Sidebar: ejercitar Matriz-staging A1/B1/C1 tras deploy.
- Login debe ir a home por rol (CLIENTE no flash /dashboard).
- Password min alineado (Perfil/Register/Reset); si diverge = regresion.
- Doble submit en modales CRUD sin loading = alarma.
- Viewports 375/768/1280: needs_validation hasta Matriz-staging.

## Voltios-Ruedas (2026-09-17)
- (Voltios-Ruedas 2026-09-17) CI rojo Vitest: leer annotations del job Frontend primero.
- (Voltios-Ruedas 2026-09-17) Tras Zod min 6→8, actualizar asserts de mensajes en tests de página.
- (Voltios-Ruedas 2026-09-17) Matriz UI A1–C3 needs_validation humana post-P0.
- (Voltios-Ruedas 2026-09-17) Pre-push frontend: npm test + npm run build.

## Voltios-Ruedas (2026-09-17b)
- (Voltios-Ruedas 2026-09-17b) Revalidacion 17-sep: QA ~3.5. Priorizar matriz Docker A1-C3 + hint UI password 6 a 8 alineado a schema.

## Voltios-Ruedas (2026-09-17c)
- (Voltios-Ruedas 2026-09-17c) Unificar password min 8 tambien en Perfil/Config (no solo Register hint).
- (Voltios-Ruedas 2026-09-17c) Submit Inventario: no dejar loading={false} hardcodeado (doble submit).
- (Voltios-Ruedas 2026-09-17c) Vercel fail no es gate QA funcional; anotar aparte de Actions verde.
