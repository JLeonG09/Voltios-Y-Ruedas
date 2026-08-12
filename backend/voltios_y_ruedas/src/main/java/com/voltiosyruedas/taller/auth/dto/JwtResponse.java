package com.voltiosyruedas.taller.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Respuesta de login exitoso con token JWT")
public class JwtResponse {
    @Schema(description = "Token JWT firmado", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String token;

    @Schema(description = "Refresh token para renovar el token de acceso (7 días)", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String refreshToken;

    @Schema(description = "Tipo de token", example = "Bearer", defaultValue = "Bearer")
    @Builder.Default
    private String tipo = "Bearer";

    @Schema(description = "ID del usuario", example = "1")
    private Long id;

    @Schema(description = "Nombre del usuario", example = "Juan")
    private String nombre;

    @Schema(description = "Apellido del usuario", example = "Pérez")
    private String apellido;

    @Schema(description = "Email del usuario", example = "juan.perez@ejemplo.com")
    private String email;

    @Schema(description = "Rol del usuario", example = "CLIENTE")
    private String rol;

    public String getNombreCompleto() {
        return nombre + " " + apellido;
    }
}