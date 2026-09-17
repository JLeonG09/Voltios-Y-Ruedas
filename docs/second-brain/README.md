# Second brain — Voltios y Ruedas

Mini second brain **del proyecto** (no es el vault general). Viví en `docs/second-brain/` dentro del repo.

## Cómo pedirlo

Decí algo como:

> **«Revisá el second brain»**

y apuntá a **`docs/second-brain/`** (esta carpeta). El agente debe usar estos pilares adaptados al stack Voltios y Ruedas, no clonar el vault entero.

## Vault general (referencia)

El second brain general (plantillas y pilares completos) está en:

`C:\Users\Leon\Documents\Obsidian\Second brain\`

Backup de staging (si hace falta):

`C:\Users\Leon\Desktop\Second-brain-staging\second-brain\`

Este mini SB solo trae trozos de **Thermos**, **QA** y **Ciberseguridad** personalizados. Para ampliar, partí de cada `Para-proyectos.md` del vault general.

## Estructura

```text
docs/second-brain/
  README.md
  Thermos/
    Alarmas.md
    Preguntas-arranque.md
    Rubrica-local.md
    Como-usar.md
  QA/
    Checklist-revision.md
    Alarmas.md
    Preguntas-arranque.md
    Matriz-staging.md
  Ciberseguridad/
    seguridad.md
    Alarmas.md
    Preguntas-arranque.md
    Pre-deploy.md
```

## Proyecto (contexto rápido)

- **Stack:** Spring Boot 3 + React/Vite + Postgres + Redis + JWT
- **Roles:** `ADMIN` / `JEFE_TALLER` / `MECANICO` / `CLIENTE`
- **Módulos:** auth, reservas, taller, vehiculo, inventario
- **Ops:** Docker Compose, Swagger, Actuator, Redis blacklist (JWT), Flyway
- **Diff base sugerida:** `main` (si no existe, la default del repo)

## Rituales sugeridos

| Pedido | Empezá por |
|--------|------------|
| Review de rama / thermos | `Thermos/Como-usar.md` + `Rubrica-local.md` |
| Ejercer UI / flujos | `QA/Checklist-revision.md` |
| Threat notes / pre-deploy | `Ciberseguridad/seguridad.md` + `Pre-deploy.md` |

Pilares en **paralelo**, no en cascada: Thermos no reemplaza QA; QA no reemplaza Ciberseguridad.

## Estado pasada 1-2 (2026-09-16)

**Codigo (WIP local, sin commit aun):** P0 backend/front aplicados en working tree — refresh hasheado, email_verificado fail-closed, validarAcceso fail-closed, DTOs, mail after-commit, rate limit /refresh, router!=menu, ErrorBoundary, revalidar /me, mapa de roles.

**Second brain general:** APPEND hecho en vault Obsidian (Frontend/QA/Backend/Ciberseguridad) con prefijo (Voltios-Ruedas 2026-09-16).

**Pendiente humano/Docker:** ejecutar QA/Matriz-staging celdas A1-C3 (deep-link, logout, viewports). Hasta entonces marcar needs_validation.

**No ejercido en review:** UI viva, contraste WCAG medido, viewports reales.
