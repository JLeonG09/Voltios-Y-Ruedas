# Pruebas del Backend

> Estructura JUnit 5 + Mockito + TestContainers. Ubicación: `backend/voltios_y_ruedas/src/test/java/com/voltiosyruedas/taller/`.

## Tests unitarios (verdes)

| Clase | Descripción |
|---|---|
| `auth/service/AuthServiceTest` | Registro (rol CLIENTE, email duplicado, cuenta pendiente según `mailService.estaHabilitado()`), login (incluye `DisabledException` para cuenta pendiente/inactiva), refresh tokens; mocks de `MailService` con `lenient()` |
| `auth/security/JwtUtilTest` | Generación/validación, token expirado/malformado → `validateToken` devuelve `false` |
| `auth/entity/UsuarioValidationTest` | Validación de la entidad |
| `reservas/service/ReservaServiceTest` | Lógica de reservas con mocks de `MailService`/notificaciones |
| `taller/service/OrdenTrabajoServiceTest` | Órdenes + stubs corregidos; tests `AccessDenied` sin `UnnecessaryStubbing` |
| `inventario/service/InventarioServiceTest` | Lógica de inventario |
| `JGLA/JglaApplicationTests` | Contexto de la app |

## Tests de integración y controladores (verdes)

> ✅ **Suite completa en verde: 161 tests.** Se corrigieron los problemas de entorno (H2) que hacían fallar CI/Docker:

| Test | Solución aplicada |
|---|---|
| `AuthServiceIntegrationTest` | Seed de roles vía `src/test/resources/data.sql` + `spring.jpa.defer-datasource-initialization=true` y `spring.sql.init.mode=always` |
| `ReservaServiceIntegrationTest` | Ídem + teléfono válido (`88888888`) |
| `OrdenTrabajoServiceIntegrationTest` | Ídem + bug real corregido: `subtotal` es columna generada (null en memoria) → se calcula en Java; colección `repuestosUtilizados` ahora se mantiene bidireccionalmente |
| `AuthControllerTest` | Anotación `@WithMockUsuario` (testutil) que pone un `Usuario` real como principal en vez de `@WithMockUser`; teléfono válido |
| `ReservaControllerTest` | `@WithMockUsuario` |
| `InventarioControllerTest` | `@WithMockUsuario` + `@BeforeEach` con fixtures |
| `OrdenTrabajoControllerTest` | `@WithMockUsuario` + `@BeforeEach` y stubs de `mapearRespuesta`/`mapBitacora` |

### Cómo se resolvió

1. **Seed de roles para perfil test**: `src/test/resources/data.sql` inserta `ADMIN/JEFE_TALLER/MECANICO/CLIENTE`; se habilita la inicialización SQL en el perfil `test`.
2. **Evitar el casteo del principal**: se creó la anotación `testutil/WithMockUsuario` + `WithMockUsuarioSecurityContextFactory`, que construye una `Authentication` con un `Usuario` real (id=1, email = `username` de la anotación) como principal. Se aplicó con el rol deseado en cada test, p. ej. `@WithMockUsuario(username="cliente@test.com", rol="CLIENTE")`.

## Ejecución

```bash
# Suite completa
mvn test

# Unitarias específicas
mvn test -Dtest='*ServiceTest' -DfailIfNoTests=false

# Con cobertura
mvn test jacoco:report
```

> Objetivo de cobertura según AGENTS.md: ≥70% servicios, ≥50% controladores. Actualmente toda la suite pasa.

Volver a [[Home]].