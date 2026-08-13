# Changelog

Todos los cambios notables de **Voltios y Ruedas** se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/)
y el proyecto respeta [Versionado Semántico](https://semver.org/lang/es/).

## [Sin publicar] - 2026-08-12

### Agregado

- **Cuenta pendiente (Opción A):** cuando `MAIL_ENABLED=true`, el registro crea la cuenta **pendiente** con `activo=false` y `emailVerificado=false`; la cuenta solo se activa al confirmar el código (`POST /api/auth/verificar-email` ahora activa ambos). El login de una cuenta pendiente devuelve `403 "Debes verificar tu correo electrónico..."` (manejando `DisabledException`), y el refresh de tokens se bloquea para cuentas inactivas o sin verificar. El panel de usuarios muestra el badge **Pendiente** para cuentas sin verificar.

- **Recuperación de contraseña por correo (producción):** `POST /api/auth/recuperar-password` ahora envía el token por SMTP (`MailService.enviarRecuperacionPassword`) con enlace `{FRONTEND_URL}/reestablecer-password?token=...` y devuelve una respuesta genérica; en dev (`MAIL_ENABLED=false`) sigue devolviendo el token en la respuesta. Nueva variable `FRONTEND_URL` (default `http://localhost:5173`) en `application.properties`, `compose.yml` y `.env.example`.

### Corregido

- **Tests de integración y controladores:** suite completa en verde (161 tests). Se añadió seed de roles para el perfil test (`src/test/resources/data.sql` + `defer-datasource-initialization`/`sql.init.mode=always`), se creó la anotación `@WithMockUsuario` (factory que pone un `Usuario` real como principal, evitando el casteo de `@WithMockUser`), se corrigieron los teléfonos de prueba a un formato CR válido y se añadieron fixtures (`@BeforeEach`) y stubs de `mapearRespuesta`/`mapBitacora` en los tests de controladores.
- **Cálculo de costos de repuestos (backend):** `subtotal` es una columna generada por BD (null en memoria), lo que provocaba NPE al recalcular costos al agregar/quitar repuestos. Ahora el subtotal se calcula en Java (`precioUnitario × cantidad`) y la colección `repuestosUtilizados` se mantiene bidireccionalmente.

- **Edición de rol (panel de administración):** el panel enviaba `rolId` (número) pero el backend esperaba un objeto `rol` (`UsuarioService.actualizar`), por lo que el rol nunca cambiaba. Ahora el frontend envía `rol: { id }` y `UsuarioService.crear` resuelve el rol desde el request (antes los usuarios creados desde el panel podían quedar sin rol). Además `actualizar` ya no anula `activo` cuando el campo no viene en el JSON.

- **Verificación de correo electrónico:** al registrarse se genera y envía un código de 6 dígitos (SMTP con `spring-boot-starter-mail`); los usuarios deben verificarlo antes de iniciar sesión. Nuevos endpoints `POST /api/auth/verificar-email` y `POST /api/auth/reenviar-codigo`, columna `email_verificado` en `usuarios` (migración `V5`) y nueva página `/verificar-email`. Si `MAIL_ENABLED=false` (desarrollo) los correos se registran por consola y la cuenta queda verificada para no bloquear el login.
- **Notificaciones por correo:** se avisan por email la agenda de diagnóstico (cita) al jefe de taller, el cambio de estado de una orden de trabajo al cliente, y el estado "trabajando" al jefe de taller y al cliente.
- **Sesión por inactividad (frontend):** al superar el tiempo configurado (`sesionTimeout`, por defecto 60 min) se cierra la sesión automáticamente; si la pestaña estuvo oculta (página abandonada) más que ese límite, también se cierra al volver. Además el estado de autenticación se persiste en `sessionStorage`, por lo que al cerrar la pestaña del navegador se pierde la sesión.
- **Validación de teléfono (Costa Rica):** los teléfonos deben ser números CR de 8 dígitos con prefijo `+506` opcional (espacios/guiones permitidos), p. ej. `+506 8888 8888`. Aplicada en frontend (Zod) y backend (DTOs y entidad `Usuario`).
- **Límites de nombre/apellido:** entre 2 y 50 caracteres (antes solo un máximo de 100), tanto en frontend como en backend.

### Corregido

- **Registro público (backend):** se eliminó el campo `rolId` de `RegisterRequest` y `/api/auth/register` ahora asigna SIEMPRE el rol `CLIENTE`. Antes el cliente podía autoregistrarse como `ADMIN`/`JEFE_TALLER` enviando un `rolId` arbitrario en el cuerpo de la petición (privilege escalation). El selector de rol también se quitó del formulario público; la asignación de roles queda solo en la gestión de usuarios para ADMIN.
- **Errores (frontend):** el interceptor de Axios ahora propaga el `mensaje` devuelto por el backend, de modo que los errores de validación y de negocio (p. ej. "Debes verificar tu correo...") se muestran de forma legible en lugar de "Request failed with status code 403".

### Corregido

- **Reservas (backend):** `/api/reservas` devolvía la entidad `Reserva` directamente; su `cliente` es una proxy lazy de Hibernate y fallaba la serialización JSON con `HTTP 500` (`ByteBuddyInterceptor`), rompiendo la página de reservas y el dashboard para el personal. Ahora los endpoints devuelven el DTO `ReservaResponse` (mismo campo `cliente` con `nombreCompleto`), igual que el módulo de órdenes.
- **Dashboard (frontend):** para el rol `CLIENTE` se llamaba a `/api/inventario/stock-bajo` (prohibido para clientes), lo que devolvía `401` y el interceptor cerraba la sesión. Ahora ese dato solo se pide cuando el usuario es staff.
- **Usuarios (filtros):** los filtros de búsqueda y por rol de la página de usuarios no filtraban nada: el service y el endpoint `/api/usuarios` no aceptaban los parámetros. Ahora `GET /api/usuarios` acepta `search` y `rol` (JPQL parametrizada) y el frontend los envía con búsqueda con debounce.
- **Filtros (backend, PostgreSQL):** al aplicar cualquier filtro (`rol` en `/api/usuarios`, `estado`/`search` en `/api/reservas`) la consulta fallaba con `HTTP 500`. La causa era `LOWER(CONCAT('%', :search, '%'))`: Hibernate la traduce a `lower('%' || ? || '%')` y PostgreSQL infiere el parámetro (que llega `NULL`) como `bytea`, por lo que `lower(bytea)` no existe. Se corrigió tipando el parámetro con `CAST(:search AS string)` en las consultas `filtrar` de `UsuarioRepository` y `ReservaRepository`; ahora los filtros por rol (usuarios) y por estado/servicio (reservas) devuelven resultados correctos.
- **Tablas (frontend):** responsividad mejorada. En pantallas menores a `md` cada fila se muestra como tarjeta apilable (etiqueta + valor), y en escritorio se mantiene la tabla con scroll horizontal. Aplica a reservas, usuarios, órdenes e inventario.
- **Filtros (frontend):** al filtrar/buscar se resetea a la primera página y se corrige la página si supera el total de resultados, evitando que la tabla quede vacía al aplicar un filtro.
- **Campo de filtro (frontend):** el icono de filtro se superponía sobre el texto del `select`. El componente `Select` ahora soporta `leftIcon` y muestra su chevrón (antes `appearance-none` ocultaba la flecha nativa sin reemplazo).
- **Contraseña (frontend):** el botón de ojo para mostrar/ocultar contraseña no funcionaba porque el contenedor del icono tenía `pointer-events-none`. Ahora el `rightIcon` interactivo (botón) recibe clics; se agregó el ojo funcional a los campos de contraseña de perfil, configuración (seguridad) y creación de usuarios.

## [Sin publicar] - 2026-08-11

### Agregado (backend)

- **Seguridad:**
  - El campo `password` ya no se expone en `UsuarioResponse` (`WRITE_ONLY`), evitando filtrar el hash en las respuestas de la API.
  - Headers de seguridad HTTP: `X-Content-Type-Options`, `X-Frame-Options` y `Strict-Transport-Security`.
  - Flujo de **refresh tokens** (acceso 24 h / refresh 7 días): endpoints `POST /api/auth/refresh` y `POST /api/auth/logout`.
  - **Rotación y reuso:** los refresh tokens se persisten en la nueva tabla `refresh_tokens` (migración `V4`). Cada renovación revoca el token usado y emite uno nuevo (con claim `jti` único); si un token ya rotado se reutiliza, se revoca toda la familia y se rechaza la petición. El logout revoca los refresh tokens activos del usuario.
  - **Códigos HTTP correctos:** nueva excepción de negocio `ApiException` con status tipado. Ahora el login con credenciales inválidas y el uso de un refresh token inválido/reutilizado devuelven `401`; el registro con email duplicado devuelve `409`; los recursos protegidos accedidos sin token devuelven `401` (antes `403`/`500`) con `ErrorResponse` JSON.
  - **Validación de datos más estricta:** `nombre` y `apellido` solo aceptan letras (acentos/ñ incluidas); el email exige parte local de 2+ caracteres, dominio de 2+ y TLD de 2+ letras (rechaza casos tipo `2@m.com`). Aplicada en frontend (Zod: registro, perfil y admin) y backend en los DTOs (`RegisterRequest`, `ActualizarPerfilRequest`, `LoginRequest`, `RecuperarPasswordRequest`) y directamente en la entidad `Usuario` (cierra también el hueco de `POST/PUT /api/usuarios`, que valida en todo guardado vía Hibernate Bean Validation).
  - Recuperación de contraseña: `POST /api/auth/recuperar-password` y `POST /api/auth/reestablecer-password` con token de un solo uso (con TTL).
  - Cambio de contraseña autenticado: `PUT /api/auth/me/password`.
- **Perfil y preferencias:** `GET/PUT /api/auth/me`, `GET/PUT /api/auth/preferencias` (tema `light/dark/system`, idioma, zona horaria, notificaciones, sesión).
- **Notificaciones:** módulo completo con `GET /api/notificaciones`, `GET /api/notificaciones/no-leidas`, `PUT /api/notificaciones/{id}/leida` y `PUT /api/notificaciones/leer-todas`.
- **Auditoría:** registro de acciones (`AuditoriaLog`) en operaciones de órdenes de trabajo e inventario.
- **Reservas:** el cliente autenticado puede actualizar sus propias reservas (`PUT /api/reservas/{id}`), con verificación de propiedad.

### Agregado (frontend)

- Code-splitting con `React.lazy` + `Suspense`: cada página es un chunk independiente (el bundle inicial bajó a ~97 kB gzip).
- Renovación automática de sesión: interceptor de Axios que refresca el token ante `401` y reintenta la petición original; cierre de sesión con invalidación del refresh token.
- Página `/recuperar-password` con formulario de recuperación.
- Página `/perfil` para editar datos personales y cambiar contraseña.
- `Configuración` conectada al backend real: perfil, tema (`light/dark/system`), idioma, zona horaria, preferencias de notificación y cambio de contraseña.
- Notificaciones reales en el header (listado, conteo de no leídas, marcar leída/todas).
- Dashboard con botones de navegación funcionales y sin datos simulados (se eliminaron `console.log` y tendencias ficticias).
- Búsqueda con *debounce* en reservas e inventario para reducir llamadas al API.
- Suite de pruebas con **Vitest + React Testing Library** (stores, validación Zod, componentes y página de recuperación).

### Configuración

- Workflow de **GitHub Actions** (`.github/workflows/ci.yml`): compila backend (Maven) y frontend (build + tests).
