# Componentes y Páginas

> Inventario de componentes UI y páginas del frontend.

## Componentes UI (`components/ui`)

| Componente | Uso |
|---|---|
| `Button` | Botones con variantes (primary, outline, danger...) |
| `Card` | Contenedor de tarjetas |
| `Input` | Campos de texto con soporte `leftIcon`/`rightIcon` (ojo de contraseña interactivo) |
| `Select` | Desplegables con `leftIcon` y chevrón propio |
| `Switch` | Toggle |
| `Badge` | Etiquetas de estado |
| `Modal` | Ventanas modales |
| `Table` | Tablas responsive (degradan a tarjetas en < md) |
| `ToastContainer` | Notificaciones toast globales (persistente, montado en App) |
| `ErrorBoundary` | Captura errores de render |

## Layout (`components/layout`)

- `MainLayout`: barra lateral + header + área de contenido.
- `AuthLayout`: layout para páginas de autenticación.
- `Header`: navegación, notificaciones (conectadas al backend), "Mi perfil", menú de usuario.
- `Sidebar`: navegación según rol y página activa.

## Páginas por rol

### Públicas
| Página | Archivo | Descripción |
|---|---|---|
| Landing | `LandingPage.tsx` | Página de inicio/marketing |
| Login | `LoginPage.tsx` | Formulario de ingreso; prellena email desde `location.state.email`; detecta "debes verificar tu correo" → /verificar-email |
| Register | `RegisterPage.tsx` | Registro de cliente; redirige a verificación si `emailVerificado===false`; toast con acción "Ir a iniciar sesión" si el email ya existe |
| Verificar email | `VerificarEmailPage.tsx` | Ingreso del código 6 dígitos + reenviar |
| Recuperar password | `RecuperarPasswordPage.tsx` | Formulario de recuperación |

### Staff
| Página | Archivo | Descripción |
|---|---|---|
| Dashboard | `DashboardPage.tsx` | Métricas, reservas/órdenes recientes, stock bajo, gráfica semanal; oculta stock bajo para CLIENTE |
| Reservas | `ReservasPage.tsx` | CRUD de citas (staff) |
| Órdenes | `OrdenesPage.tsx` | Órdenes de trabajo con repuestos y bitácora |
| Inventario | `InventarioPage.tsx` | Repuestos y ajuste de stock |
| Usuarios | `UsuariosPage.tsx` | CRUD de usuarios (ADMIN/JEFE) con búsqueda+debounce y filtro por rol |
| Configuración | `ConfiguracionPage.tsx` | Perfil (guardar real), apariencia/tema (light/dark/system), notificaciones, seguridad (cambio de contraseña), sistema |

### Cliente
| Página | Archivo | Descripción |
|---|---|---|
| Mi vehículo | `MiVehiculoPage.tsx` | Alta/edición de vehículos propios |
| Mi historial | `MiHistorialPage.tsx` | Órdenes, diagnósticos, repuestos, bitácora y costos |
| Mis reservas | `MisReservasPage.tsx` | Agenda/edita/cancela citas |
| Perfil | `PerfilPage.tsx` | Datos personales + cambio de contraseña |

## Hooks

- `useDarkMode`: delega el tema al `uiStore`.
- `useDebounce`: búsquedas debounced (reservas, inventario, usuarios).
- `useSessionTimeout`: cierra sesión tras 60 min sin actividad; también si la pestaña estuvo oculta más del límite; revoca refresh token con `keepalive`.

Volver a [[Home]].