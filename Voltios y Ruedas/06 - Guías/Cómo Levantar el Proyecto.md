# Cómo Levantar el Proyecto

> Guía paso a paso para ejecutar el sistema localmente.

## Requisitos

- Docker + Docker Compose.
- Linux/WSL o Windows con Docker Desktop.
- (Opcional) Cuenta ngrok y su `NGROK_AUTHTOKEN`.

## Levantar el stack

```powershell
# Desde la raíz del repo
git clone <url-del-repo> Proyecto-Taller
cd Proyecto-Taller

# Copiar variables (editar JWT_SECRET, contraseñas...)
Copy-Item .env.example .env

# Levantar todo
docker compose up -d --build
```

### Con URL pública (ngrok)

```powershell
docker compose -f compose.yml -f compose.ngrok.yml up -d --build
```

## Verificar

- **Health**: `docker compose ps` → todos `healthy`.
- **App**: http://localhost:8080/actuator/health → `{"status":"UP"}`.
- **Web**: http://localhost
- **Swagger**: http://localhost/swagger-ui/

## Credenciales de prueba vigentes en la BD

| Email | Rol | Contraseña |
|---|---|---|
| `admin2@test.com` | ADMIN | `admin123` |
| `josueleon.102013@gmail.com` | ADMIN | la registrada |
| `test@test.com` / `new@test.com` | CLIENTE | la registrada |
| `josueleon.102012@gmail.com` | CLIENTE | la registrada |

> ⚠️ `cliente@test.com` **no existe**. Los clientes se crean desde `/register` o `POST /api/auth/register`.

## Comandos frecuentes

```powershell
# Logs
docker compose logs -f app
docker compose logs -f frontend
docker compose logs -f ngrok

# Reconstruir solo algo
docker compose build frontend && docker compose up -d frontend

# Detener (conserva volúmenes)
docker compose down

# Detener y borrar datos (¡ba-D!)
docker compose down -v

# Consola de la BD
docker exec -it voltios_ruedas_db psql -U postgres -d taller_db

# Consola Redis
docker exec -it voltios_ruedas_redis redis-cli
```

## Flujos de la app

1. Registrar un cliente → verificar email (si hay SMTP) → login.
2. Con un ADMIN (`admin2@test.com`/`admin123`) crear mecánicos, repuestos y reservas.
3. Cliente agenda reservas, registra vehículos y consulta su historial.

> **Ctrl+Shift+R** tras cada deploy por la caché inmutable de nginx.

Ver también: [[04 - DevOps/Docker y Compose|Docker y Compose]], [[07 - Progreso/Estado del Proyecto|Estado del Proyecto]].

Volver a [[Home]].