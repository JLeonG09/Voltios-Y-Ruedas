# Pruebas del Frontend

> Vitest + React Testing Library. Ejecución: `npm test` (o `npm run test`).

## Tests existentes

| Archivo | Cobertura |
|---|---|
| `components/ui/Button.test.tsx` | Rendering y variantes del botón |
| `store/authStore.test.ts` | Login/logout/setTokens del store de auth |
| `store/uiStore.test.ts` | Estado del tema y notificaciones |
| `utils/validation.test.ts` | Esquemas Zod (email, teléfono CR, contraseña, nombre/apellido, registro, perfil, admin) |
| `pages/RecuperarPasswordPage.test.tsx` | Formulario de recuperación con validación y envío |

## Estados

- **Suite completa**: `npm test` → **30 tests, todos en verde**.
- `npm run build` → OK (tsc + vite).

## Ejecución

```bash
npm test            # Vitest (una vez)
npm run test:watch  # Modo watch
npm run coverage    # Reporte de cobertura (si está configurado)
```

## Convenciones (AGENTS.md)

- Validar formularios con **Zod + React Hook Form**.
- Errores en español.
- Estructura de carpetas sugerida: `frontend/src/__tests__/{components,services,utils}`.

Volver a [[Home]].