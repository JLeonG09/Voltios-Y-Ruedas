# Pre-deploy — Voltios y Ruedas

Antes de promover a un entorno compartido. Adaptado del pilar Ciberseguridad del vault general.

## Secretos y config

- [ ] Secrets del entorno desde el store correcto; **sin** valores de staging en prod
- [ ] `JWT_SECRET` y credenciales Postgres/Redis **no** están en el repo (solo `.env.example` con placeholders)
- [ ] App falla cerrada si falta un secreto crítico al arrancar (`JWT_SECRET`, `POSTGRES_*` en compose)
- [ ] Compose/nginx **no** publican Postgres/Redis/8080 al host (solo `:80` nginx). Dev: ports temporales documentados en `compose.yml`

## TLS / edge / headers

- [ ] TLS terminado correctamente; redirects HTTP→HTTPS donde aplique
- [ ] Headers / CSP alineados con el front React real (needs_validation si el edge no está en el repo)
- [ ] Si hay proxy: `TRUST_FORWARDED_HEADERS=true` **solo** detrás de nginx/proxy que controle XFF

## Auth y roles

- [ ] Smoke: login, refresh (hash), logout (blacklist Redis + JWT Bearer), rol incorrecto → 401/403
- [ ] `/api/auth/me` y logout **sin** token → 401 (no permitAll)
- [ ] Flujos por rol: `ADMIN` / `JEFE_TALLER` / `MECANICO` / `CLIENTE`
- [ ] Rutas admin y mutaciones de inventario/órdenes protegidas en API (no solo UI)
- [ ] IDOR smoke: cliente A no lee reserva/orden de cliente B (fail-closed)
- [ ] Comunicar a usuarios: re-login tras migrate `V7` (refresh tokens limpios)

## Superficies ops

- [ ] **Actuator** no expuesto a internet sin control
- [ ] **Swagger** off o autenticado en prod / entorno compartido
- [ ] Métricas/health no filtran secretos ni PII

## Datos

- [ ] Migraciones **Flyway** revisadas (`V6` email fail-closed default; `V7` hash refresh — sin PII/secretos en seeds)
- [ ] Logging sin tokens / passwords / Authorization / PII
- [ ] Backup / retención acordados para el dato que se despliega
- [ ] Inventario/auditoría responden DTO (smoke JSON sin proxies Hibernate)

## Dependencias y rollback

- [ ] Deps e imagen base actualizadas / escaneadas en lo razonable
- [ ] Plan de rollback
- [ ] Plan de rotación de `JWT_SECRET` + invalidación de sesiones si algo sale mal

## Decisión

- [ ] **Listo para promover** (checks anteriores OK o riesgos aceptados por escrito)
- [ ] **No promover** (motivo en una línea + dueño)

Ver también [[seguridad]] y Thermos [[Rubrica-local|rúbrica local]] si el release incluye diff de auth.
