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
import com.voltiosyruedas.taller.common.exception.ApiException;
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

        // Verificación de correo: genera y envía el código (Redis + SMTP/consola).
        if (mailService.estaHabilitado()) {
            try {
                emailVerificationService.generarYCodigo(guardado.getEmail());
            } catch (Exception e) {
                logger.warn("No se pudo enviar el código de verificación a {}: {}", request.getEmail(), e.getMessage());
            }
        }
        return guardado;
    }

    public String login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            // Verificación de correo: bloquear acceso hasta verificar el email.
            Usuario usuario = usuarioRepository.findByEmail(request.getEmail()).orElse(null);
            if (usuario != null && !Boolean.TRUE.equals(usuario.getEmailVerificado())) {
                throw ApiException.forbidden("Debes verificar tu correo electrónico antes de iniciar sesión");
            }

            String rol = userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
            auditService.registrar("LOGIN", "USUARIO", null, "Inicio de sesión con email " + request.getEmail());
            return jwtUtil.generateToken(userDetails, rol);
        } catch (BadCredentialsException e) {
            auditService.registrar("LOGIN_FALLIDO", "USUARIO", null,
                    "Intento de inicio de sesión fallido con email " + request.getEmail());
            logger.warn("Intento de login fallido para email: {}", request.getEmail());
            throw e;
        } catch (org.springframework.security.authentication.DisabledException e) {
            // Cuenta pendiente (no verificada) o desactivada por un administrador.
            Usuario usuario = usuarioRepository.findByEmail(request.getEmail()).orElse(null);
            if (usuario != null && !Boolean.TRUE.equals(usuario.getEmailVerificado())) {
                throw ApiException.forbidden("Debes verificar tu correo electrónico antes de iniciar sesión");
            }
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
        RefreshToken registro = RefreshToken.builder()
                .usuario(usuario)
                .token(token)
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

        RefreshToken registro = refreshTokenRepository.findByToken(refreshToken).orElse(null);
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
            logger.warn("No se pudo revocar el refresh token durante el logout: {}", e.getMessage());
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
            // No revelar si el email existe o no
            return null;
        }
        auditService.registrar("SOLICITAR_RECUPERACION", "USUARIO", null,
                "Se solicitó la recuperación de contraseña para " + email);
        String token = passwordResetService.crearToken(email);
        if (mailService.estaHabilitado()) {
            // Producción: el token viaja por correo y nunca se expone en la respuesta.
            try {
                mailService.enviarRecuperacionPassword(email, token);
            } catch (Exception e) {
                logger.warn("No se pudo enviar el correo de recuperación a {}: {}", email, e.getMessage());
            }
            return null;
        }
        return token;
    }

    @Transactional
    public void restablecerPassword(String token, String nuevaPassword) {
        String email = passwordResetService.obtenerEmailPorToken(token);
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.notFound("Usuario no encontrado con email: " + email));
        usuario.setPassword(passwordEncoder.encode(nuevaPassword));
        usuarioRepository.save(usuario);
        passwordResetService.eliminarToken(token);
        auditService.registrar("RESTABLECER_PASSWORD", "USUARIO", usuario.getId(),
                "Se restableció la contraseña de " + email);
    }
}
