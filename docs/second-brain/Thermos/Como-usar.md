# Cómo usar Thermos — Voltios y Ruedas

## Instalación (Cursor)

```text
/add-plugin thermos
```

Plugin: [cursor/plugins → thermos](https://github.com/cursor/plugins/tree/main/thermos)

## Ritual (obligatorio en diffs de riesgo)

1. Acotá alcance: PR, rama vs **`main`** (o default del repo), o lista de archivos.
2. Reuní `git diff` + contenido de archivos tocados.
3. Lanzá **en paralelo** (mismo paquete de contexto):
   - pasada **bugs + security + roturas/devex** (`thermo-nuclear-review`)
   - pasada **code quality / mantenibilidad** (`thermo-nuclear-code-quality-review`)
4. **Síntesis:** dedupe; solapes pesan más; severidad por evidencia (path:línea).
5. **Si el diff toca frontend de auth/roles/layout root:** en la pasada bugs+security verificá (a) RBAC en el **router** (deep-link a rutas que el menú oculta), (b) `ErrorBoundary` en root con Reintentar, (c) revalidación `GET /api/auth/me` al hidratar persist. El menú solo no cuenta.

Esquema mental:

```text
bugs+security  ||  quality  →  síntesis
```

Si no tenés el plugin: mantené el mismo ritual con la herramienta que usen (dos pasadas paralelas + síntesis).

## Rúbrica local

Antes de marcar merge-ready desde Thermos, cruzá hallazgos con:

→ [[Rubrica-local]]

Paths sensibles y umbrales del repo viven ahí.

## Coordinación

- QA ejerce flujos tocados en paralelo (`docs/second-brain/QA/`).
- Ciberseguridad para threat notes / pre-deploy (`docs/second-brain/Ciberseguridad/`).
- No alcanza un “LGTM” de una sola pasada en cambios de auth, JWT, roles o migraciones.
