# Preguntas de arranque — seguridad · Voltios y Ruedas

Kickoff o al «revisar el second brain» (`docs/second-brain/`). Una frase por respuesta. **Sin secretos reales.**

## Datos y riesgo

1. ¿Qué PII de clientes/vehículos/reservas maneja el cambio?
2. ¿Hay riesgo multi-cliente (un `CLIENTE` viendo datos de otro)?
3. ¿Quién es el atacante realista? (anónimo, CLIENTE, MECANICO, insider con CI)

## Identidad y acceso

4. ¿Authn sigue siendo JWT + blacklist Redis?
5. ¿Qué roles toca el cambio (`ADMIN` / `JEFE_TALLER` / `MECANICO` / `CLIENTE`) y qué **no** pueden hacer?
6. ¿Dónde se decide authz (`SecurityConfig`, annotations, service)?
7. ¿Hay rutas paralelas (API vs UI vs Actuator/Swagger) al mismo dato?

## Secretos y entorno

8. ¿`JWT_SECRET` y credenciales DB/Redis viven solo en env/store (no repo)?
9. ¿Si falta un secreto al arrancar, falla cerrado?
10. ¿Quién puede leer logs, Actuator y el secret store?

## Superficie

11. ¿Qué queda expuesto vía compose/nginx (API, web, Actuator, Swagger, DB, Redis)?
12. ¿Hay uploads, redirects o IDs controlados por el usuario en el patch?
13. ¿Swagger/Actuator están acotados en el entorno donde se prueba?

## Cadena de entrega

14. ¿Cómo entra el código a prod y qué secretos tiene el job de CI?
15. ¿Deps pinneadas / escaneadas en este cambio?
16. ¿Imágenes/artefactos por digest o tag mutable?

## Operación

17. ¿Qué alarmas de [[Alarmas]] aplican a este cambio?
18. ¿Cómo se rota `JWT_SECRET` y se invalidan sesiones (blacklist)?
19. ¿Qué queda `needs_validation` (edge TLS, exposición real de Actuator)?

## Cierre

20. ¿Qué tres controles deben existir antes de un deploy compartido? (ver [[Pre-deploy]])
21. ¿`seguridad.md` del mini SB está al día?
22. ¿Basta guidance de PR / Thermos o hace falta auditoría formal (Fury → Black Widow)?

## Resultado esperado

Actualizar [[seguridad]] + [[Pre-deploy]] si cambió la superficie. Nunca pegar valores de `.env`.
