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

    @Transactional
    public Usuario registrar(RegisterRequest request) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw ApiException.conflict("El email ya está registrado");
        }

        Rol rol = rolRepository.findById(request.getRolId() != null ? request.getRolId() : 4L)
                .orElseThrow(() -> ApiException.badRequest("Rol no encontrado"));

        Usuario usuario = Usuario.builder()
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .telefono(request.getTelefono())
                .direccion(request.getDireccion())
                .rol(rol)
                .activo(true)
                .build();

        Usuario guardado = usuarioRepository.save(usuario);
        auditService.registrar("REGISTRO", "USUARIO", guardado.getId(),
                "Nuevo usuario registrado con email " + guardado.getEmail());
        return guardado;
    }

    public String login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            String rol = userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
            auditService.registrar("LOGIN", "USUARIO", null, "Inicio de sesión con email " + request.getEmail());
            return jwtUtil.generateToken(userDetails, rol);
        } catch (BadCredentialsException e) {
            auditService.registrar("LOGIN_FALLIDO", "USUARIO", null,
                    "Intento de inicio de sesión fallido con email " + request.getEmail());
            logger.warn("Intento de login fallido para email: {}", request.getEmail());
            throw e;
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
     * Inicia la recuperación de contraseña. Como el proyecto aún no envía correos,
     * devuelve el token generado para que el frontend pueda completar el flujo.
     * En producción este token debe enviarse por email y NO devolverse en la respuesta.
     */
    public String iniciarRecuperacion(String email) {
        boolean existe = usuarioRepository.findByEmail(email).isPresent();
        if (!existe) {
            // No revelar si el email existe o no
            return null;
        }
        auditService.registrar("SOLICITAR_RECUPERACION", "USUARIO", null,
                "Se solicitó la recuperación de contraseña para " + email);
        return passwordResetService.crearToken(email);
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
