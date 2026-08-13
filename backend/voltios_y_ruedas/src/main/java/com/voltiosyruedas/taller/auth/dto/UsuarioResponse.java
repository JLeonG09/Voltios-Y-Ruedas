package com.voltiosyruedas.taller.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Respuesta con información del usuario")
public class UsuarioResponse {
    @Schema(description = "ID del usuario", example = "1")
    private Long id;

    @Schema(description = "Nombre del usuario", example = "Juan")
    private String nombre;

    @Schema(description = "Apellido del usuario", example = "Pérez")
    private String apellido;

    @Schema(description = "Email del usuario", example = "juan.perez@ejemplo.com")
    private String email;

    @Schema(description = "Teléfono del usuario", example = "123456789")
    private String telefono;

    @Schema(description = "Dirección del usuario", example = "Calle Falsa 123")
    private String direccion;

    @Schema(description = "Indica si el usuario está activo", example = "true")
    private Boolean activo;

    @Schema(description = "Indica si el correo electrónico fue verificado", example = "false")
    private Boolean emailVerificado;

    @Schema(description = "Fecha de creación del usuario", example = "2026-01-15T10:30:00")
    private LocalDateTime fechaCreacion;

    @Schema(description = "Fecha de última actualización", example = "2026-01-20T15:45:00")
    private LocalDateTime fechaActualizacion;

    @Schema(description = "Información del rol del usuario")
    private RolResponse rol;

    public String getNombreCompleto() {
        return nombre + " " + apellido;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Información del rol")
    public static class RolResponse {
        @Schema(description = "ID del rol", example = "4")
        private Long id;

        @Schema(description = "Nombre del rol", example = "CLIENTE")
        private String nombre;

        @Schema(description = "Descripción del rol", example = "Cliente del taller")
        private String descripcion;
    }
}