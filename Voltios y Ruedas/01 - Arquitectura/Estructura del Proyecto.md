# Estructura del Proyecto

> Árbol de directorios del repositorio `Proyecto-Taller`.

## Raíz del repo

```
Proyecto-Taller/
├── .github/workflows/       → CI (build backend + tests frontend)
├── backend/
│   └── voltios_y_ruedas/
│       ├── src/main/java/com/voltiosyruedas/taller/   → código backend
│       ├── src/main/resources/                        → application.properties, db/migration
│       └── src/test/java/com/voltiosyruedas/taller/   → tests
├── frontend/
│   ├── src/                  → código frontend
│   ├── Dockerfile            → build Node → nginx
│   └── nginx.conf            → proxy reverso y caché
├── "Voltios y Ruedas/"       → este vault de Obsidian
├── .env / .env.example       → variables de entorno
├── AGENTS.md                 → directrices obligatorias de desarrollo
├── CHANGELOG.md              → Keep a Changelog + SemVer
├── PROYECTO.md               → estado del proyecto (resumen vivo)
├── compose.yml               → orquestación principal
├── compose.ngrok.yml         → overlay ngrok
└── render.yaml               → despliegue en Render
```

## Estructura del backend (`com.voltiosyruedas.taller`)

Monolito modular por dominio:

```
ProyectoTallerApplication.java   → clase principal
├── auth/        → Usuario, Rol, login/register, JWT, AuthService, UsuarioService
│   ├── controller/  → AuthController, UsuarioController
│   ├── dto/         → request/response (LoginRequest, RegisterRequest, JwtResponse, ...)
│   ├── entity/      → Usuario, Rol, RefreshToken
│   ├── repository/  → UsuarioRepository, RolRepository, RefreshTokenRepository
│   ├── security/    → SecurityConfig, JwtUtil, JwtAuthenticationFilter, TokenBlacklistService, RateLimitingFilter, GlobalExceptionHandler
│   └── service/     → AuthService, UsuarioService, EmailVerificationService, PasswordResetService
├── reservas/    → Reserva, ReservaService, ReservaRepository, DTOs
├── taller/      → OrdenTrabajo, Bitacora, OrdenTrabajoInventario, service/controller/repository
├── inventario/  → Inventario, InventarioService, ...
├── vehiculo/    → Vehiculo, VehiculoService, ...
├── notificaciones/ → Notificacion, NotificacionService, MailService
├── auditoria/   → AuditoriaLog, AuditService, AuditoriaController
└── common/      → exception/ (ApiException, ErrorResponse...), config/ (Render...)
```

## Estructura del frontend (`frontend/src`)

```
frontend/src/
├── App.tsx                → rutas + guards (RutaStaff, RutaCliente, RutaProtegida)
├── main.tsx               → bootstrap React
├── components/
│   ├── layout/            → MainLayout, AuthLayout, Header, Sidebar
│   └── ui/                → Button, Card, Input, Select, Switch, Badge, Modal, Table, ToastContainer, ErrorBoundary
├── pages/                 → LandingPage, LoginPage, RegisterPage, VerificarEmailPage, DashboardPage,
│                            ReservasPage, OrdenesPage, InventarioPage, UsuariosPage,
│                            ConfiguracionPage, PerfilPage, MiVehiculoPage, MiHistorialPage, MisReservasPage
├── services/              → api.ts (axios con refresh) + servicios por recurso
├── store/                 → authStore, uiStore (Zustand + persist)
├── hooks/                 → useDarkMode, useDebounce, useSessionTimeout
├── types/                 → interfaces TS por dominio
└── utils/                 → validation.ts (esquemas Zod), helpers.ts
```

Nota: los archivos del **primer commit** documentados en la sección [[07 - Progreso/Correcciones Recientes|Correcciones Recientes]] mueven varios archivos; verificar la estructura real en el repo si se necesita la correspondencia exacta.

Volver a [[Home]].