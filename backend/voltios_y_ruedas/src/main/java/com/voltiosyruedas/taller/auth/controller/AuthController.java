package com.voltiosyruedas.taller.auth.controller;

import com.voltiosyruedas.taller.auth.dto.JwtResponse;
import com.voltiosyruedas.taller.auth.dto.LoginRequest;
import com.voltiosyruedas.taller.auth.dto.RegisterRequest;
import com.voltiosyruedas.taller.auth.dto.UsuarioResponse;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.auth.security.TokenBlacklistService;
import com.voltiosyruedas.taller.auth.service.AuthService;
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

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Endpoints de login, registro, logout y gestión de tokens JWT")
public class AuthController {

    private final AuthService authService;
    private final TokenBlacklistService tokenBlacklistService;

    @PostMapping("/login")
    @Operation(
        summary = "Iniciar sesión",
        description = "Autentica un usuario con email y contraseña, retorna un token JWT firmado"
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
        Usuario usuario = (Usuario) org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();

        JwtResponse response = JwtResponse.builder()
                .token(token)
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .email(usuario.getEmail())
                .rol(usuario.getRol().getNombre())
                .build();

        return ResponseEntity.ok(response);
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
    public ResponseEntity<Void> logout(Authentication authentication) {
        String authHeader = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getCredentials().toString();
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            tokenBlacklistService.blacklistToken(token, 86400000);
        }
        
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
        
        UsuarioResponse response = UsuarioResponse.builder()
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .email(usuario.getEmail())
                .telefono(usuario.getTelefono())
                .direccion(usuario.getDireccion())
                .activo(usuario.getActivo())
                .fechaCreacion(usuario.getFechaCreacion())
                .fechaActualizacion(usuario.getFechaActualizacion())
                .rol(UsuarioResponse.RolResponse.builder()
                        .id(usuario.getRol().getId())
                        .nombre(usuario.getRol().getNombre())
                        .descripcion(usuario.getRol().getDescripcion())
                        .build())
                .build();

        return ResponseEntity.ok(response);
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
        Usuario usuario = (Usuario) authentication.getPrincipal();
        
        UsuarioResponse response = UsuarioResponse.builder()
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .email(usuario.getEmail())
                .telefono(usuario.getTelefono())
                .direccion(usuario.getDireccion())
                .activo(usuario.getActivo())
                .fechaCreacion(usuario.getFechaCreacion())
                .fechaActualizacion(usuario.getFechaActualizacion())
                .rol(UsuarioResponse.RolResponse.builder()
                        .id(usuario.getRol().getId())
                        .nombre(usuario.getRol().getNombre())
                        .descripcion(usuario.getRol().getDescripcion())
                        .build())
                .build();

        return ResponseEntity.ok(response);
    }
}