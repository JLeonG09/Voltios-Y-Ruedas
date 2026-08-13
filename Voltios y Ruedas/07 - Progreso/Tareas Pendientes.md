# Tareas Pendientes

> Mejoras y tareas sugeridas. Fuente: `PROYECTO.md` + trabajo reciente.

## Prioridad alta

- [x] **Endpoint de recuperación de contraseña en producción**: hoy devuelve el token en dev; en prod debe enviarse por correo (SMTP). ✅ Resuelto — ver [[02 - Backend/Correo y Notificaciones|Correo y Notificaciones]].
- [x] **Corregir tests de integración y controladores** (H2): seed de roles para el perfil test y evitar el casteo de `@WithMockUser` (ver [[05 - Testing/Pruebas del Backend|Pruebas del Backend]]). ✅ Resuelto — suite completa en verde (161 tests).

## Prioridad media

- [ ] **Commit de los cambios pendientes**: cuenta pendiente + edición de rol, verificación de email, SMTP, sesión, teléfono, JwtUtil, tests corregidos (todo sin commitear).
- [ ] Backend para reservas de cliente: permitir editar (hoy solo cancelar) o esconder el botón.
- [ ] Dashboard: quitar `console.log` restantes, implementar "Ver todas"/"Ver reporte completo".
- [ ] Tests con cobertura ≥70% servicios (JaCoCo).
- [ ] Rate limiting documentado en Swagger (aplicado pero no expuesto).
- [ ] Frontend: crear página `/reestablecer-password` (el backend ya envía el enlace `{FRONTEND_URL}/reestablecer-password?token=...`).

## Prioridad baja / mejoras

- [ ] Persistir preferencia "Sistema" del selector de tema.
- [ ] Auditoría/logs de actividad con toggle persistente real.
- [ ] Paginación/filtros completos y búsqueda debounced en todos los listados.
- [ ] Headers de seguridad ya presentes; revisar políticas CSP si surgen bloqueos en producción.
- [ ] Internacionalización (i18n) — opción de idioma sin efecto aún.
- [ ] Recuperar contraseña página robusta en producción.

## Estado del repo (2026-08-12)

- Cambios **sin commitear** (git status: modificados backend, frontend, compose, `.env.example`, CHANGELOG; nuevos: MailService, EmailVerificationService, VerificarEmailRequest, V5, VerificarEmailPage, useSessionTimeout, `WithMockUsuario` + factory, `data.sql` de test).
- **SMTP real ACTIVO** (`MAIL_ENABLED=true`, Gmail + App Password) — registrado y verificado con envío real. En prod `POST /api/auth/recuperar-password` envía el token por correo y devuelve `null`; en dev (`MAIL_ENABLED=false`) lo devuelve en la respuesta.
- **Suite de tests en verde (161 tests)**: seed de roles vía `src/test/resources/data.sql` + `@WithMockUsuario` (factory con `Usuario` real como principal) en los tests de controladores.
- BD: solo quedan el admin `josueleon.102013@gmail.com` (id=4) y `alexanderts201514@gmail.com` (id=22, creado fuera de sesión); backup `backup_pre_limpieza.sql`.

Volver a [[Home]].