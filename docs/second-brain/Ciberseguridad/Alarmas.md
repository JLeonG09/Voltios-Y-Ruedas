# Alarmas — Voltios y Ruedas (defensa)

Señales que deben hacer ruido **antes** de un incidente. Monitoreo y triage, no ataque.

## Auth e identidad (JWT + Redis)

| Señal | Por qué importa | Primera respuesta |
|-------|-----------------|-------------------|
| Picos de login fallido | Credential stuffing / enumeración | Rate limit; no filtrar si la cuenta existe |
| Token usado tras logout | Blacklist Redis rota o cache stale | Verificar blacklist; rotar si hace falta |
| Login OK con rol inesperado | Claims / authz rota | Invalidar sesiones; revisar `SecurityConfig` / Jwt* |
| Cambio de password / email | Toma de cuenta | Re-auth; invalidar otras sesiones |
| Spike 401 en `/api/auth/refresh` | Reuso / tokens invalidados (p. ej. post-`V7`) o abuso | Revisar rate limit refresh; forzar re-login |
| Login sin `emailVerificado` aceptado | Fail-open de verificación | Revisar default entidad/DB y chequeo en login |

## Autorización y datos

| Señal | Por qué importa | Primera respuesta |
|-------|-----------------|-------------------|
| 403/404 anómalos en IDs de reserva/vehículo/orden | Sondeo IDOR | Revisar authz por recurso y rol |
| Cliente lee/escribe datos de otro cliente | Falla de aislamiento | Contener; auditar queries/controllers |
| Acceso admin / inventario fuera de patrón | Abuso de privilegio | Suspender; revisar audit |
| 401 masivo en `mis-*` / `/me` con JWT “válido” | Principal no-`Usuario` o filtro JWT | Revisar `SecurityUtils` / JwtAuthenticationFilter |

## Secretos e infraestructura

| Señal | Por qué importa | Primera respuesta |
|-------|-----------------|-------------------|
| Secreto en CI log / repo / ticket | Fuga | Rotar de inmediato (`JWT_SECRET`, DB, Redis) |
| Fallo al montar secretos al arrancar | Riesgo fail-open | Verificar que la app **no** arrancó degradada |
| Actuator/Swagger alcanzable sin auth en entorno compartido | Superficie ops | Cerrar exposición; revisar compose/nginx |
| Postgres/Redis/8080 alcanzables desde internet | Superficie de datos | Quitar ports host; solo red compose + nginx |
| Dep / imagen con CVE crítico en uso | Superficie conocida | Patch o mitigar |

## Disponibilidad y abuso

| Señal | Por qué importa | Primera respuesta |
|-------|-----------------|-------------------|
| 429 / timeouts en login o refresh | Abuso o mal config | Ajustar límites; distinguir ataque vs bug |
| Health OK pero 5xx en rutas auth | Degradación peligrosa | Rollback; no silenciar |
| Respuestas 500 con mensajes técnicos de BD | Fuga de info | Verificar `GlobalExceptionHandler` no expone `getMessage()` |

## Qué no es alarma sola

- Header de seguridad faltante sin frontera rota (hardening)
- CVE en dep no alcanzable (triage primero)
- Un 401 aislado de un usuario legítimo
- Oleada de re-login tras deploy con `V7` (esperado: refresh legacy invalidado)

## Severidad operativa

1. **P0** — acceso a datos ajenos o secretos en claro → contener + rotar ya  
2. **P1** — auth/authz/JWT blacklist degradado → fix mismo día  
3. **P2** — señal de abuso sin impacto claro → investigar en horario  
4. **P3** — hardening / deuda → backlog con dueño  

Tras P0/P1: nota corta (qué pasó, qué se rotó, qué falta validar). Sin secretos en la nota.
