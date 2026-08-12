# Changelog

Todos los cambios notables de **Voltios y Ruedas** se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/)
y el proyecto respeta [Versionado Semántico](https://semver.org/lang/es/).

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
