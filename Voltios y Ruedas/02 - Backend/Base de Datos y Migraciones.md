# Base de Datos y Migraciones

> PostgreSQL 16 gestionado con Flyway. Directorio: `backend/voltios_y_ruedas/src/main/resources/db/migration/`.

## Reglas de migraciones (AGENTS.md)

- Nombre: `V{numero}__{descripcion}.sql`.
- **Nunca** modificar una migración ya ejecutada → crear una nueva.
- **Nunca** `DROP TABLE` sin backup.
- Usar `BEGIN; ... COMMIT;` en migraciones críticas.
- Agregar índices en columnas de búsqueda frecuente.
- Flyway NO tiene rollback automático → crear migración inversa.

## Migraciones existentes

| Archivo | Contenido |
|---|---|
| `V1__init_schema.sql` | roles (seed 4), usuarios, reservas, ordenes_trabajo, bitacoras, inventario, ordenes_trabajo_inventario + índices |
| `V2__vehiculos.sql` | tabla vehiculos + índice + estados |
| `V3__agregar_preferencias_notificaciones_auditoria.sql` | `preferencias` (JSON) en usuarios, `notificaciones`, `auditoria` |
| `V4__crear_tabla_refresh_tokens.sql` | tabla refresh_tokens (rotación/reuso) |
| `V5__agregar_email_verificado.sql` | columna `email_verificado` (default TRUE) en usuarios |

## Modelo de datos

```mermaid
erDiagram
    ROLES ||--o{ USUARIOS : tiene
    USUARIOS ||--o{ RESERVAS : hace
    USUARIOS ||--o{ VEHICULOS : posee
    USUARIOS ||--o{ ORDENES_TRABAJO : cliente
    USUARIOS ||--o{ ORDENES_TRABAJO : mecanico
    RESERVAS ||--o| ORDENES_TRABAJO : "puede generar"
    ORDENES_TRABAJO ||--o{ BITACORAS : historial
    ORDENES_TRABAJO ||--o{ ORDENES_TRABAJO_INVENTARIO : usa
    INVENTARIO ||--o{ ORDENES_TRABAJO_INVENTARIO : consumido
    USUARIOS ||--o{ NOTIFICACIONES : recibe
    USUARIOS ||--o{ REFRESH_TOKENS : tiene
    USUARIOS ||--o{ AUDITORIA : "registra acciones"

    ROLES { bigint id PK }
    USUARIOS { bigint id PK, string email UK, string password, string telefono, string direccion, boolean activo, json preferencias, boolean email_verificado }
    RESERVAS { bigint id PK, bigint cliente_id FK, timestamp fecha_hora, string categoria_servicio, string estado }
    VEHICULOS { bigint id PK, bigint cliente_id FK, string placa UK, string marca, string modelo, int anio, int kilometraje, string estado }
    ORDENES_TRABAJO { bigint id PK, bigint reserva_id UK FK, bigint cliente_id FK, bigint mecanico_id FK, string numero_orden UK, string estado, decimal costo_total }
    BITACORAS { bigint id PK, bigint orden_trabajo_id FK, bigint usuario_id FK, string accion, string estado_anterior, string estado_nuevo }
    ORDENES_TRABAJO_INVENTARIO { bigint id PK, bigint orden_trabajo_id FK, bigint inventario_id FK, int cantidad, decimal precio_unitario, decimal subtotal }
    INVENTARIO { bigint id PK, string codigo UK, string nombre, int stock_actual, int stock_minimo, decimal precio_venta, boolean activo }
    NOTIFICACIONES { bigint id PK, bigint usuario_id FK, string titulo, string tipo, boolean leida }
    REFRESH_TOKENS { bigint id PK, bigint usuario_id FK, string token UK, timestamp expiracion, boolean revocado }
    AUDITORIA { bigint id PK, bigint usuario_id FK, string accion, string entidad, string detalle, string ip }
```

## Tablas y estados

- **roles**: ADMIN, JEFE_TALLER, MECANICO, CLIENTE (seed).
- **usuarios.estado** → no existe; se usa `activo` (boolean).
- **reservas.estado**: `PENDIENTE` (default), `CANCELADA`, `COMPLETADA` y otros según lógica.
- **ordenes_trabajo.estado** (CHECK): `RECIEN_INGRESADO`, `POR_INGRESAR`, `TRABAJANDO`, `TERMINADO`, `ENTREGADO`.
- **vehiculos.estado** (CHECK): `DISPONIBLE`, `EN_TALLER`, `EN_REPARACION`, `LISTO`, `ENTREGADO`.

## Cardinalidades clave

- `ordenes_trabajo.reserva_id` es **UNIQUE** (una reserva → a lo sumo una orden).
- `ordenes_trabajo_inventario` tiene clave única `(orden_trabajo_id, inventario_id)`.

## Config en `application.properties`

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/taller_db
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
```

En Docker, `SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/taller_db` (compose.yml).

Volver a [[Home]].