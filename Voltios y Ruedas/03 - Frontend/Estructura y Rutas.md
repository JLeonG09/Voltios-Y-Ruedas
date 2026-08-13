# Estructura y Rutas

> Navegación del frontend (React Router). Archivo principal: `frontend/src/App.tsx`.

## Rutas públicas

| Ruta | Página |
|---|---|
| `/` | Landing (RutaRaiz: según autenticación redirige) |
| `/login` | LoginPage |
| `/register` | RegisterPage |
| `/verificar-email` | VerificarEmailPage |
| `/recuperar-password` | RecuperarPasswordPage |

## Rutas protegidas (staff: ADMIN / JEFE_TALLER / MECANICO)

| Ruta | Página | Guard |
|---|---|---|
| `/dashboard` | DashboardPage | RutaStaff |
| `/reservas` | ReservasPage | RutaStaff |
| `/ordenes` | OrdenesPage | RutaStaff |
| `/inventario` | InventarioPage | RutaStaff |
| `/usuarios` | UsuariosPage | RutaStaff |
| `/configuracion` | ConfiguracionPage | RutaStaff |

## Rutas protegidas (cliente y común)

| Ruta | Página | Guard |
|---|---|---|
| `/perfil` | PerfilPage | RutaProtegida |
| `/mi-vehiculo` | MiVehiculoPage | RutaCliente |
| `/mi-historial` | MiHistorialPage | RutaCliente |
| `/mis-reservas` | MisReservasPage | RutaCliente |

## Guardas de rutas

- **RutaRaiz**: no autenticado → Landing; CLIENTE → `/mi-vehiculo`; staff → `/dashboard`.
- **RutaStaff**: no autenticado → `/`; CLIENTE → `/mi-vehiculo`; resto → children.
- **RutaCliente**: no autenticado → `/`; no CLIENTE → `/dashboard`; CLIENTE → children.
- **RutaProtegida**: solo requiere autenticación.
- Rutas desconocidas → redirigen a `/`.

## Code-splitting

- Todas las páginas usan `React.lazy` + `Suspense` (bundle inicial ≈ 97 kB gzip).
- `FallbackPagina`: spinner mientras carga (`Loader2` de lucide-react).
- `ErrorBoundary` global en App para manejar errores de render.

## Layouts

- `AuthLayout`: envuelve login/register/verificar/recuperar.
- `MainLayout`: sidebar + header + contenido para páginas autenticadas.

Volver a [[Home]].