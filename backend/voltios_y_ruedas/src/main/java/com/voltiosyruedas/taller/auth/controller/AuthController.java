package com.voltiosyruedas.taller.auth.controller;

import com.voltiosyruedas.taller.auditoria.service.AuditService;
import com.voltiosyruedas.taller.auth.dto.*;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.auth.security.TokenBlacklistService;
import com.voltiosyruedas.taller.auth.service.AuthService;
import com.voltiosyruedas.taller.auth.service.EmailVerificationService;
import com.voltiosyruedas.taller.auth.service.UsuarioService;
import com.voltiosyruedas.taller.common.exception.ApiException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Endpoints de login, registro, logout y gestión de tokens JWT")
public class AuthController {

    private final AuthService authService;
    private final UsuarioService usuarioService;
    private final TokenBlacklistService tokenBlacklistService;
    private final AuditService auditService;
    private final EmailVerificationService emailVerificationService;
    private final com.voltiosyruedas.taller.notificaciones.service.MailService mailService;

    @PostMapping("/verificar-email")
    @Operation(
        summary = "Verificar correo electrónico",
        description = "Confirma la cuenta usando el código de 6 dígitos enviado por correo"
    )
    public ResponseEntity<Map<String, String>> verificarEmail(@Valid @RequestBody VerificarEmailRequest request) {
        emailVerificationService.verificar(request.getEmail(), request.getCodigo());
        auditService.registrar("VERIFICAR_EMAIL", "USUARIO", null,
                "Correo verificado para " + request.getEmail());
        return ResponseEntity.ok(Map.of("mensaje", "Correo verificado correctamente"));
    }

    @PostMapping("/reenviar-codigo")
    @Operation(
        summary = "Reenviar código de verificación",
        description = "Genera y envía un nuevo código de verificación al email indicado"
    )
    public ResponseEntity<Map<String, String>> reenviarCodigo(@Valid @RequestBody RecuperarPasswordRequest request) {
        String codigo = emailVerificationService.reenviarCodigo(request.getEmail());
        auditService.registrar("REENVIAR_CODIGO", "USUARIO", null,
                "Intento de reenvío de código de verificación");
        Map<String, String> respuesta = new java.util.HashMap<>();
        respuesta.put("mensaje", "Si el correo está registrado y no está verificado, se envió un nuevo código de verificación");
        if (codigo != null && !mailService.estaHabilitado()) {
            respuesta.put("codigo", codigo);
        }
        return ResponseEntity.ok(respuesta);
    }

    @PostMapping("/login")
    @Operation(
        summary = "Iniciar sesión",
        description = "Autentica un usuario con email y contraseña, retorna un token JWT firmado y un refresh token"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Login exitoso",
            content = @Content(schema = @Schema(implementation = JwtResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Datos de entrada inválidos",
            content = @Content(schema = @Schema(implementation = com.voltiosyruedas.taller.common.exception.ErrorResponse.class))
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Credenciales inválidas",
            content = @Content(schema = @Schema(implementation = com.voltiosyruedas.taller.common.exception.ErrorResponse.class))
        )
    })
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        String token = authService.login(request);
        Usuario usuario = usuarioService.obtenerPorEmail(request.getEmail());
        String refreshToken = authService.crearRefreshToken(usuario);

        JwtResponse response = JwtResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .tipo("Bearer")
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .email(usuario.getEmail())
                .rol(usuario.getRol().getNombre())
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(
        summary = "Renovar token de acceso",
        description = "Intercambia un refresh token válido por un nuevo par de tokens (rotación)"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Tokens renovados",
            content = @Content(schema = @Schema(implementation = JwtResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Refresh token inválido o expirado",
            content = @Content(schema = @Schema(implementation = com.voltiosyruedas.taller.common.exception.ErrorResponse.class))
        )
    })
    public ResponseEntity<JwtResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refrescarToken(request.getRefreshToken()));
    }

    @PostMapping("/logout")
    @Operation(
        summary = "Cerrar sesión",
        description = "Invalida el token JWT actual agregándolo a la lista negra",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Logout exitoso"
        ),
        @ApiResponse(
            responseCode = "401",
            description = "No autenticado - Token JWT faltante o inválido",
            content = @Content(schema = @Schema(implementation = com.voltiosyruedas.taller.common.exception.ErrorResponse.class))
        )
    })
    public ResponseEntity<Void> logout(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody(required = false) RefreshTokenRequest body) {
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            String token = authorizationHeader.substring(7).trim();
            if (!token.isEmpty()) {
                tokenBlacklistService.blacklistToken(token, 86400000);
            }
        }
        if (body != null) {
            authService.cerrarSesion(body.getRefreshToken());
        }
        auditService.registrar("LOGOUT", "USUARIO", null, "Cierre de sesión");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/register")
    @Operation(
        summary = "Registrar nuevo usuario",
        description = "Crea un nuevo usuario en el sistema con rol CLIENTE por defecto"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Usuario registrado exitosamente",
            content = @Content(schema = @Schema(implementation = UsuarioResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Datos de entrada inválidos",
            content = @Content(schema = @Schema(implementation = com.voltiosyruedas.taller.common.exception.ErrorResponse.class))
        ),
        @ApiResponse(
            responseCode = "409",
            description = "El email ya está registrado",
            content = @Content(schema = @Schema(implementation = com.voltiosyruedas.taller.common.exception.ErrorResponse.class))
        )
    })
    public ResponseEntity<UsuarioResponse> register(@Valid @RequestBody RegisterRequest request) {
        Usuario usuario = authService.registrar(request);
        return ResponseEntity.ok(mapUsuario(usuario));
    }

    @PostMapping("/recuperar-password")
    @Operation(
        summary = "Solicitar recuperación de contraseña",
        description = "Genera un token de recuperación para el email indicado. "
                + "Con SMTP habilitado (producción) el token se envía por correo; "
                + "en desarrollo se devuelve en la respuesta para facilitar el flujo local."
    )
    public ResponseEntity<?> recuperarPassword(@Valid @RequestBody RecuperarPasswordRequest request) {
        String token = authService.iniciarRecuperacion(request.getEmail());
        if (token == null) {
            return ResponseEntity.ok(Map.of(
                    "mensaje", "Si el email está registrado, recibirás las instrucciones para recuperar tu contraseña"
            ));
        }
        // Solo en desarrollo se devuelve el token; en producción debe enviarse por correo.
        return ResponseEntity.ok(Map.of(
                "mensaje", "Se generó un token de recuperación",
                "token", token
        ));
    }

    @PostMapping("/reestablecer-password")
    @Operation(
        summary = "Restablecer contraseña",
        description = "Restablece la contraseña usando el token de recuperación"
    )
    public ResponseEntity<Map<String, String>> reestablecerPassword(@Valid @RequestBody PasswordResetRequest request) {
        authService.restablecerPassword(request.getToken(), request.getNuevaPassword());
        return ResponseEntity.ok(Map.of("mensaje", "Contraseña restablecida correctamente"));
    }

    @PutMapping("/me")
    @Operation(
        summary = "Actualizar perfil propio",
        description = "Actualiza nombre, apellido, teléfono y dirección del usuario autenticado",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<UsuarioResponse> actualizarPerfil(
            Authentication authentication,
            @Valid @RequestBody ActualizarPerfilRequest request) {
        Usuario usuario = usuarioAutenticado(authentication);
        Usuario actualizado = usuarioService.actualizarPerfil(usuario.getId(), request);
        return ResponseEntity.ok(usuarioService.toResponse(actualizado));
    }

    @GetMapping("/preferencias")
    @Operation(
        summary = "Obtener preferencias del usuario",
        description = "Retorna las preferencias de configuración del usuario autenticado",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<PreferenciasRequest> obtenerPreferencias(Authentication authentication) {
        Usuario usuario = usuarioAutenticado(authentication);
        return ResponseEntity.ok(usuarioService.obtenerPreferencias(usuario.getId()));
    }

    @PutMapping("/preferencias")
    @Operation(
        summary = "Guardar preferencias del usuario",
        description = "Persiste las preferencias de configuración del usuario autenticado",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<PreferenciasRequest> guardarPreferencias(
            Authentication authentication,
            @RequestBody PreferenciasRequest preferencias) {
        Usuario usuario = usuarioAutenticado(authentication);
        usuarioService.guardarPreferencias(usuario.getId(), preferencias);
        return ResponseEntity.ok(preferencias);
    }

    @GetMapping("/me")
    @Operation(
        summary = "Obtener usuario autenticado",
        description = "Retorna la información del usuario actualmente autenticado mediante el token JWT",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Usuario autenticado",
            content = @Content(schema = @Schema(implementation = UsuarioResponse.class))
        ),
        @ApiResponse(
            responseCode = "401",
            description = "No autenticado - Token JWT faltante o inválido",
            content = @Content(schema = @Schema(implementation = com.voltiosyruedas.taller.common.exception.ErrorResponse.class))
        )
    })
    public ResponseEntity<UsuarioResponse> getCurrentUser(Authentication authentication) {
        Usuario usuario = usuarioAutenticado(authentication);
        return ResponseEntity.ok(mapUsuario(usuario));
    }

    /**
     * Resuelve el usuario autenticado de forma robusta: si el principal es la
     * entidad {@link Usuario} (filtro JWT) se usa directamente; en caso contrario
     * (p. ej. @WithMockUser o credenciales de formulario) se resuelve por email.
     */
    private Usuario usuarioAutenticado(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw ApiException.unauthorized("No autenticado");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof Usuario usuario) {
            return usuario;
        }
        return usuarioService.obtenerPorEmail(authentication.getName());
    }

    private UsuarioResponse mapUsuario(Usuario usuario) {
        return UsuarioResponse.builder()
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .email(usuario.getEmail())
                .telefono(usuario.getTelefono())
                .direccion(usuario.getDireccion())
                .activo(usuario.getActivo())
                .emailVerificado(usuario.getEmailVerificado())
                .fechaCreacion(usuario.getFechaCreacion())
                .fechaActualizacion(usuario.getFechaActualizacion())
                .rol(usuario.getRol() != null ? UsuarioResponse.RolResponse.builder()
                        .id(usuario.getRol().getId())
                        .nombre(usuario.getRol().getNombre())
                        .descripcion(usuario.getRol().getDescripcion())
                        .build() : null)
                .build();
    }
}
