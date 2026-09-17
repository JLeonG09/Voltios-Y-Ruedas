# Preguntas de arranque (Thermos) — Voltios y Ruedas

Hacerlas al abrir un PR, rama o pedido de “thermos / thermo-nuclear review”.

## Alcance

1. ¿Qué se revisa: PR, rama vs **`main`** (o default), o lista de archivos?
2. ¿Cuál es el diff canónico? (`git diff main...HEAD` u otro acordado)
3. ¿Qué **no** entra (`node_modules`, `target/`, lockfile ruidoso, generated)?

## Contexto para los subagentes

4. ¿Ya está reunido `git diff` + contenido de archivos tocados?
5. ¿El patch toca `SecurityConfig`, `Jwt*`, `Auth*`, controllers, `.env.example`, compose/nginx o migraciones Flyway?
6. ¿Hay discusión previa (humana/BugBot) que haya que deduplicar?

## Doble pasada

7. ¿Se lanzan **ambas** en paralelo (bugs+security ∥ quality) según [[Como-usar]]?
8. ¿Mismo paquete de contexto a las dos?
9. ¿Quién sintetiza y con qué regla de solape?

## Riesgo local

10. ¿Qué es bloqueante aquí (JWT/blacklist, roles, PII de clientes, inventario, reservas)?
11. ¿El front niega por **router** las rutas ocultas al rol? ¿Revalida `/api/auth/me` al hidratar? ¿Hay ErrorBoundary en root?
12. ¿Hay archivo cerca del límite ~1k líneas en el diff?
13. ¿Qué incertidumbre aceptamos documentada vs qué obliga re-check?

## Coordinación

14. ¿QA ejerce login / reservas cliente / órdenes staff / inventario en paralelo?
15. ¿Ciberseguridad pide threat notes o pre-deploy aparte de la pasada security?
16. ¿Rúbrica local leída? → [[Rubrica-local]]

## Decisión

17. ¿Qué define “merge-ready desde Thermos” en este repo?
18. ¿A quién asignamos medium+ y con qué evidencia mínima (path:línea)?
19. ¿Re-corremos thermos tras el fix o solo diff del remedo?

Usar junto a [[Alarmas]] y [[Como-usar]].
