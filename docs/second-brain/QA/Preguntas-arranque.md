# Preguntas de arranque (QA) — Voltios y Ruedas

Hacerlas al tomar un ticket, PR o doc de flujo. Si faltan respuestas, el riesgo queda explícito.

## Alcance

1. ¿Qué flujo cambia: login, reservas cliente, órdenes staff, inventario, u otro?
2. ¿Cuáles son las pantallas / rutas tocadas?
3. ¿Qué **no** entra en este cambio?
4. ¿Hay criterio de aceptación ejercible? ¿Dónde vive?

## Cómo ejercerlo

5. ¿En qué ambiente (Compose local / staging) y con qué rol (`ADMIN` / `JEFE_TALLER` / `MECANICO` / `CLIENTE`)?
6. ¿Tras login, el destino es por rol (`CLIENTE` → `/mi-vehiculo`, staff → `/dashboard`) o todos caen en dashboard?
7. ¿Qué datos mínimos hacen falta (usuario, vehículo, ítem de inventario) y quién los crea?
8. ¿Cuál es el happy path paso a paso?
9. ¿Cuáles son los tres fallos más probables (permiso, vacío, error de API)?

## Riesgo

10. ¿Toca auth, roles, borrado, inventario o datos de clientes?
11. ¿El **router** (no solo Sidebar) niega las rutas que el menú oculta? ¿403 o redirect al deep-link?
12. ¿Al hidratar sesión se llama `GET /api/auth/me` o se confía el rol del persist?
13. ¿Hay `ErrorBoundary` en root (`main`/`App`) con fallback + reintento?
14. ¿Qué flujos vecinos pueden regresar (reservas ↔ taller ↔ vehiculo)?
15. ¿Hay feature flag? ¿Cómo se ve on y off?
16. ¿Qué queda **fuera** de lo ejercible en este ciclo? (declarar “no ejercido”; matriz A1–C3 en [[Matriz-staging]])

## Calidad de interfaz

17. ¿Hay modal, formulario largo o tabla? (teclado + responsive 375/768/1280)
18. ¿Mensajes de error son de producto o técnicos?
19. ¿Se ejercieron los tres viewports objetivo?
20. ¿Se corrió la matriz staging A1–C3 (Docker/humano) o se declaró pendiente?

## Coordinación (pilares en paralelo)

21. ¿Thermos corre en paralelo sobre el mismo diff? (`docs/second-brain/Thermos/`)
22. ¿Ciberseguridad aplica si hay auth/JWT/actuator/swagger?
23. ¿A quién reporto bloqueantes y en qué formato?

## Decisión

24. ¿Qué define “listo para merge **desde QA**” en este ticket?
25. ¿Quién re-verifica el fix y con qué evidencia?

Usar junto a [[Checklist-revision]] y [[Matriz-staging]] cuando la respuesta a 1–4 y 10 esté clara.
