# Docker y Compose

> Orquestación de los 4 servicios con Docker Compose. Archivos: `compose.yml` + `compose.ngrok.yml` (overlay).

## Servicios (`compose.yml`)

| Servicio | Imagen | Healthcheck | Volumen |
|---|---|---|---|
| postgres | `postgres:16-alpine` | `pg_isready -U postgres -d taller_db` (10s/5s/5) | `pgdata` |
| redis | `redis:7-alpine` | `redis-cli ping` (10s/3s/5) | `redisdata` |
| app | `backend/voltios_y_ruedas/Dockerfile` | `wget` a `/actuator/health` (30s/3s/60s/3) | — |
| frontend | `frontend/Dockerfile` | `curl` a `:80` (30s/3s/10s/3) | — |

Dependencias:
- `app` espera `postgres` y `redis` healthy.
- `frontend` espera `app` healthy.

## Variables de entorno (app)

```yaml
SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE:-prod}
POSTGRES_USER / POSTGRES_PASSWORD
JWT_SECRET / JWT_EXPIRATION
TZ: ${TZ:-America/Costa_Rica}
SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/taller_db
SPRING_DATA_REDIS_HOST: redis / PORT: 6379
MAIL_ENABLED / MAIL_HOST / MAIL_PORT / MAIL_USERNAME / MAIL_PASSWORD / MAIL_FROM
```

## Puertos

- `8080` (app), `80` (frontend), `5432` (postgres), `6379` (redis).

## ngrok overlay (`compose.ngrok.yml`)

- Imagen `ngrok/ngrok:latest`, contenedor `voltios_ruedas_ngrok`.
- Requiere `NGROK_AUTHTOKEN` en `.env`.
- Comando: `http --log=stdout --domain=vocalist-wrongly-pedometer.ngrok-free.dev http://frontend:80`.
- `depends_on: frontend`, `restart: unless-stopped`.
- Todos los servicios están en la red por defecto de compose → ngrok alcanza `frontend:80`.

## Comandos útiles

```powershell
# Levantar todo (con ngrok)
docker compose -f compose.yml -f compose.ngrok.yml up -d --build

# Solo servicios base
docker compose up -d --build

# Ver URL pública de ngrok
docker compose -f compose.yml -f compose.ngrok.yml logs -f ngrok

# Reconstruir y redeployar solo el frontend
docker compose build frontend
docker compose up -d frontend

# Logs
docker compose logs -f frontend   # o app / postgres / redis / ngrok

# Estado
docker compose -f compose.yml -f compose.ngrok.yml ps
```

> **Recarga forzada**: nginx cachea los assets como `immutable, 1y` → tras cada deploy usar **Ctrl+Shift+R**.

## Dockerfiles

### Backend
- `backend/voltios_y_ruedas/Dockerfile`: multi-stage (build Maven → runtime JRE 21). Usa `-DskipTests` para no romper el build con tests de integración que fallan.

### Frontend
- Stage builder `node:22-alpine` → `npm ci` + `npm run build`.
- Stage producción `nginx:alpine` + `curl`; copia `dist/` y `nginx.conf`; sirve en :80.

Ver también: [[04 - DevOps/ngrok y URL Pública|ngrok y URL Pública]].

Volver a [[Home]].