package com.voltiosyruedas.taller.auth.service;

import com.voltiosyruedas.taller.auditoria.service.AuditService;
import com.voltiosyruedas.taller.auth.dto.JwtResponse;
import com.voltiosyruedas.taller.auth.dto.LoginRequest;
import com.voltiosyruedas.taller.auth.dto.RegisterRequest;
import com.voltiosyruedas.taller.auth.entity.RefreshToken;
import com.voltiosyruedas.taller.auth.entity.Rol;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.auth.repository.RefreshTokenRepository;
import com.voltiosyruedas.taller.auth.repository.RolRepository;
import com.voltiosyruedas.taller.auth.repository.UsuarioRepository;
import com.voltiosyruedas.taller.auth.security.JwtUtil;
import com.voltiosyruedas.taller.auth.security.TokenHashUtil;
import com.voltiosyruedas.taller.common.exception.ApiException;
import com.voltiosyruedas.taller.common.transaction.AfterCommit;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final AuditService auditService;
    private final PasswordResetService passwordResetService;
    private final EmailVerificationService emailVerificationService;
    private final com.voltiosyruedas.taller.notificaciones.service.MailService mailService;
    private final com.voltiosyruedas.taller.auth.security.LoginAttemptService loginAttemptService;

    @Transactional
    public Usuario registrar(RegisterRequest request) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw ApiException.conflict("El email ya está registrado");
        }

        // El registro público siempre crea clientes; el rol no debe venir del request.
        Rol rol = rolRepository.findByNombre("CLIENTE")
                .orElseThrow(() -> ApiException.badRequest("Rol CLIENTE no encontrado"));

        // Opción A: cuando el envío de correo está habilitado la cuenta queda
        // PENDIENTE (inactiva y sin verificar) hasta que se confirme el código.
        // En desarrollo (sin SMTP) la cuenta queda activa y verificada de inmediato.
        boolean requiereVerificacion = mailService.estaHabilitado();

        Usuario usuario = Usuario.builder()
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .telefono(request.getTelefono())
                .direccion(request.getDireccion())
                .rol(rol)
                .activo(!requiereVerificacion)
                .emailVerificado(!requiereVerificacion)
                .build();

        Usuario guardado = usuarioRepository.save(usuario);
        auditService.registrar("REGISTRO", "USUARIO", guardado.getId(),
                "Nuevo usuario registrado con email " + guardado.getEmail());

        // Side-effect de correo fuera de la TX de negocio (after-commit).
        if (mailService.estaHabilitado()) {
            String emailDestino = guardado.getEmail();
            AfterCommit.run(() -> {
                try {
                    emailVerificationService.generarYCodigo(emailDestino);
                } catch (Exception e) {
                    logger.warn("No se pudo enviar el código de verificación a {}", emailDestino);
                }
            });
        }
        return guardado;
    }

    public String login(LoginRequest request) {
        String email = request.getEmail().toLowerCase();

        // Account lockout: si la cuenta está bloqueada, rechazar inmediatamente.
        if (loginAttemptService.estaBloqueada(email)) {
            long segundosRestantes = loginAttemptService.tiempoBloqueoRestanteSegundos(email);
            auditService.registrar("LOGIN_BLOQUEADO", "USUARIO", null,
                    "Intento de login en cuenta bloqueada: " + email);
            long minutos = segundosRestantes / 60;
            throw ApiException.unauthorized(
                    "Demasiados intentos fallidos de inicio de sesión. " +
                    "La cuenta está bloqueada por " + minutos + " minutos. Intente más tarde.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            // Verificación de correo: bloquear acceso hasta verificar el email.
            Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
            if (usuario != null && !Boolean.TRUE.equals(usuario.getEmailVerificado())) {
                throw ApiException.forbidden("Debes verificar tu correo electrónico antes de iniciar sesión");
            }

            // Login exitoso: limpiar contador de intentos fallidos.
            loginAttemptService.limpiarIntentos(email);

            String rol = userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
            auditService.registrar("LOGIN", "USUARIO", null, "Inicio de sesión exitoso");
            return jwtUtil.generateToken(userDetails, rol);
        } catch (BadCredentialsException e) {
            loginAttemptService.registrarIntentoFallido(email);
            auditService.registrar("LOGIN_FALLIDO", "USUARIO", null,
                    "Intento de inicio de sesión fallido");
            logger.warn("Intento de login fallido para email: {}", email);
            throw e;
        } catch (org.springframework.security.authentication.DisabledException e) {
            // Cuenta pendiente (no verificada) o desactivada por un administrador.
            Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
            if (usuario != null && !Boolean.TRUE.equals(usuario.getEmailVerificado())) {
                throw ApiException.forbidden("Debes verificar tu correo electrónico antes de iniciar sesión");
            }
            loginAttemptService.registrarIntentoFallido(email);
            throw ApiException.forbidden("Tu cuenta está inactiva");
        }
    }

    public String generarRefreshToken(UserDetails userDetails) {
        String rol = userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        return jwtUtil.generateRefreshToken(userDetails, rol);
    }

    /**
     * Genera un refresh token y lo persiste para permitir la rotación
     * y la detección de reuso (si un token ya rotado se vuelve a usar).
     */
    @Transactional
    public String crearRefreshToken(Usuario usuario) {
        String token = jwtUtil.generateRefreshToken(usuario, usuario.getRol().getNombre());
        String tokenHash = TokenHashUtil.sha256Hex(token);
        RefreshToken registro = RefreshToken.builder()
                .usuario(usuario)
                .token(tokenHash)
                .expiracion(jwtUtil.extractExpiration(token).toInstant()
                        .atZone(java.time.ZoneId.systemDefault()).toLocalDateTime())
                .revocado(false)
                .build();
        refreshTokenRepository.save(registro);
        return token;
    }

    @Transactional
    public JwtResponse refrescarToken(String refreshToken) {
        if (!jwtUtil.isTokenValid(refreshToken)) {
            throw ApiException.unauthorized("Refresh token inválido o expirado");
        }
        String email = jwtUtil.extractUsername(refreshToken);
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.unauthorized("Refresh token inválido o expirado"));

        // Cuentas pendientes (sin verificar) o inactivas no pueden renovar tokens.
        if (!Boolean.TRUE.equals(usuario.getActivo())
                || !Boolean.TRUE.equals(usuario.getEmailVerificado())) {
            throw ApiException.unauthorized("Refresh token inválido o expirado");
        }

        String tokenHash = TokenHashUtil.sha256Hex(refreshToken);
        RefreshToken registro = refreshTokenRepository.findByToken(tokenHash).orElse(null);
        if (registro == null || registro.getRevocado() || registro.getExpiracion().isBefore(LocalDateTime.now())) {
            // Token no vigente: posible reuso tras rotación. Se revoca toda la familia.
            revocarTokensUsuario(usuario.getId());
            throw ApiException.unauthorized("Refresh token inválido o expirado");
        }

        // Rotación: se invalida el token usado y se emite un par nuevo.
        registro.setRevocado(true);
        refreshTokenRepository.save(registro);

        String nuevoAccessToken = jwtUtil.generateToken(usuario, usuario.getRol().getNombre());
        String nuevoRefreshToken = crearRefreshToken(usuario);

        auditService.registrar("REFRESH_TOKEN", "USUARIO", usuario.getId(),
                "Se renovó el token de acceso para " + usuario.getEmail());

        return JwtResponse.builder()
                .token(nuevoAccessToken)
                .refreshToken(nuevoRefreshToken)
                .tipo("Bearer")
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .email(usuario.getEmail())
                .rol(usuario.getRol().getNombre())
                .build();
    }

    /**
     * Cierra la sesión revocando todos los refresh tokens activos del usuario.
     * El token de acceso se invalida vía lista negra en el controlador.
     */
    @Transactional
    public void cerrarSesion(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }
        try {
            String email = jwtUtil.extractUsername(refreshToken);
            Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
            if (usuario != null) {
                revocarTokensUsuario(usuario.getId());
            }
        } catch (Exception e) {
            logger.warn("No se pudo revocar el refresh token durante el logout");
        }
    }

    private void revocarTokensUsuario(Long usuarioId) {
        List<RefreshToken> activos = refreshTokenRepository.findByUsuarioIdAndRevocadoFalse(usuarioId);
        activos.forEach(t -> t.setRevocado(true));
        refreshTokenRepository.saveAll(activos);
    }

    /**
     * Inicia la recuperación de contraseña. En desarrollo (SMTP deshabilitado)
     * devuelve el token generado para que el frontend pueda completar el flujo.
     * En producción (SMTP habilitado) el token se envía por correo y NO se
     * devuelve en la respuesta.
     */
    public String iniciarRecuperacion(String email) {
        boolean existe = usuarioRepository.findByEmail(email).isPresent();
        if (!existe) {
            auditService.registrar("SOLICITAR_RECUPERACION", "USUARIO", null,
                    "Solicitud de recuperación para email no registrado");
            return null;
        }
        String token = passwordResetService.crearToken(email);
        if (mailService.estaHabilitado()) {
            try {
                mailService.enviarRecuperacionPassword(email, token);
                auditService.registrar("SOLICITAR_RECUPERACION", "USUARIO", null,
                        "Token de recuperación enviado por correo");
            } catch (Exception e) {
                logger.warn("No se pudo enviar el correo de recuperación: {}", e.getMessage());
                auditService.registrar("SOLICITAR_RECUPERACION", "USUARIO", null,
                        "Falló el envío de correo de recuperación");
            }
            return null;
        }
        auditService.registrar("SOLICITAR_RECUPERACION", "USUARIO", null,
                "Token de recuperación generado en modo desarrollo (sin SMTP)");
        return token;
    }

    @Transactional
    public void restablecerPassword(String token, String nuevaPassword) {
        String email = passwordResetService.obtenerEmailPorToken(token);
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.notFound("Usuario no encontrado"));
        usuario.setPassword(passwordEncoder.encode(nuevaPassword));
        usuarioRepository.save(usuario);
        passwordResetService.eliminarToken(token);
        loginAttemptService.limpiarIntentos(email);
        auditService.registrar("RESTABLECER_PASSWORD", "USUARIO", usuario.getId(),
                "Contraseña restablecida correctamente");
    }
}
