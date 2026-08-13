# Troubleshooting

> Problemas conocidos y soluciones.

## Docker / Contenedores

### El contenedor `app` queda `unhealthy`
- **Causa:** el healthcheck responde que `/actuator/health` no está UP, típicamente por SMTP con credenciales inválidas o Redis/BD no accesibles.
- **Solución**: verificar variables en `.env`. Si el SMTP está mal configurado, dejar `MAIL_ENABLED=false` o corregir `MAIL_USERNAME/PASSWORD`. Reconstruir: `docker compose up -d --build app`.

### Build de la app falla al compilar tests
- **Causa**: tests de integración con clases que no compilan en el entorno (antes `AuthServiceTest` usaba `rolId` inexistente).
- **Solución**: corregir el test (usar `findByNombre("CLIENTE")`), y el Dockerfile usa `-DskipTests` para no ejecutar tests de integración rotos.

### La URL de ngrok cambió o no aparece
- `docker compose -f compose.yml -f compose.ngrok.yml logs -f ngrok` muestra `url=...`.
- Asegurarse de que `NGROK_AUTHTOKEN` esté en `.env` y que el contenedor ngrok esté corriendo.
- El dominio estático del plan free es el documentado en [[04 - DevOps/ngrok y URL Pública|ngrok]].

## Backend

### Login devuelve 401 pese a credenciales correctas
- Si el email requiere verificación (`email_verificado=false`) el login se bloquea → verificar el correo primero o desactivar SMTP en dev (`MAIL_ENABLED=false` deja todo verificado).
- Revisar `JWT_SECRET`: tras cambiarlo, los tokens viejos dejan de valer.

### 500 al listar reservas/órdenes
- Históricamente por entidades lazy; hoy se devuelven DTOs (`ReservaResponse`/`OrdenTrabajoResponse`) → si reaparece, verificar serialización de proxies.

### Filtros de usuarios/reservas no filtran
- Se corrigió tipando con `CAST(:search AS string)` en las consultas JPQL (PostgreSQL infería `bytea` con `NULL`). No romper esa tipificación.

## Frontend

### Páginas de cliente crashean al hacer `.map`
- **Causa**: algún servicio sin prefijo `/api/` devolvía `index.html` (200).
- **Solución**: asegurar que todos los `services/*.ts` usen `/api/`.

### Recarga muestra CSS/JS viejos
- Caché inmutable de nginx → **Ctrl+Shift+R**.

### No se guarda el perfil en Configuración (histórico)
- **Causa**: `@Pattern` estricto de teléfono rechazaba `""`.
- **Solución ya aplicada**: `PATTERN_TELEFONO` acepta vacío + validación Zod en frontend (`perfilSchema`).

### El ojo de contraseña no hace nada
- **Causa**: `pointer-events-none` en el contenedor del icono.
- **Solución ya aplicada**: `rightIcon` interactivo (botón) recibe clics.

### La sesión se cierra al recargar
- Comportamiento esperado: la sesión se persiste en `sessionStorage` (requisito de seguridad). Re-login tras cerrar/abrir pestaña.

## Tests

| Síntoma | Solución |
|---|---|
| `AuthServiceTest` no compila | Usar `rolRepository.findByNombre("CLIENTE")`, no `findById`. |
| `UnnecessaryStubbing` en `OrdenTrabajoServiceTest` | Quitar stubs de `findById` en tests `AccessDenied`. |
| Tests de integración/controladores H2 fallan | Pendiente seed de roles para perfil test (ver [[05 - Testing/Pruebas del Backend|Pruebas del Backend]]). |

## SMTP

Ver [[04 - DevOps/SMTP y Gmail|SMTP y Gmail]] (errores 535, contenedor unhealthy, etc.).

## Consejo general

- `docker compose logs -f app` para errores de backend.
- `npm run build` y `npm test` en `frontend/` para detectar problemas de TS/tests.
- Consultar [[07 - Progreso/Estado del Proyecto|Estado del Proyecto]] y [[07 - Progreso/Tareas Pendientes|Tareas Pendientes]].

Volver a [[Home]].