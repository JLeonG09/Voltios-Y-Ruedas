# Convenciones de Commits

> Directrices obligatorias según `AGENTS.md`. Ver también [[07 - Progreso/Estado del Proyecto|Estado del Proyecto]].

## Conventional Commits

Formato:

```
<tipo>(<scope>): <descripción>

<cuerpo opcional>

<footer opcional>
```

## Tipos permitidos

| Tipo | Uso |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Documentación |
| `style` | Formato sin lógica |
| `refactor` | Reestructura sin cambio funcional |
| `perf` | Mejoras de performance |
| `test` | Agregar/actualizar pruebas |
| `chore` | Build, dependencias, CI/CD |
| `security` | Parches de seguridad |
| `ci` | Cambios en CI/CD |

## Scopes

`auth`, `reservas`, `taller`, `inventario`, `api`, `bd`, `seguridad`, `ui`, `config`, `docker`.

## Ejemplos reales del historial

```
fix(ui): corregir filtros, responsividad de tablas y ojo de contraseña
fix(reservas): devolver ReservaResponse para evitar HTTP 500 y corregir dashboard para clientes
fix(security): permitir CORS por patrones (same-origin detras de nginx/ngrok daba 403 en login)
feat(deploy): overlay ngrok para exponer el frontend local con URL publica
refactor(reservas): quitar mecanicoId, agregar busqueda y filtro por estado, fix fechas
feat(auth): verificación de correo, notificaciones por email y sesión por inactividad
```

## Branching (Git Flow simplificado)

- `main` → producción (solo PRs aprobados).
- `develop` → integración.
- `feature/*`, `bugfix/*`, `hotfix/*`.

```bash
git checkout develop
git checkout -b feature/nombre-funcionalidad
# ... commits ...
git push origin feature/nombre-funcionalidad
# PR → aprobado → merge a develop → release a main con tag vX.Y.Z
```

## Versionado Semántico

`MAJOR.MINOR.PATCH`:
- **MAJOR**: breaking changes.
- **MINOR**: nuevas funcionalidades compatibles.
- **PATCH**: correcciones de bugs.

## Reglas del proyecto

- Todo el código/documentación en **español**.
- `camelCase` para variables/propiedades JSON, `PascalCase` clases/interfaces, `SCREAMING_SNAKE_CASE` constantes.
- No commitear `.env` ni secretos.

Volver a [[Home]].