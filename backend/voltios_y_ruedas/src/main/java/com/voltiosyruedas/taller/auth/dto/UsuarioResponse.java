package com.voltiosyruedas.taller.auth.dto;

import com.voltiosyruedas.taller.auth.entity.Rol;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioResponse {
    private Long id;
    private String nombre;
    private String apellido;
    private String email;
    private String telefono;
    private String direccion;
    private Boolean activo;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    private RolResponse rol;

    public String getNombreCompleto() {
        return nombre + " " + apellido;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RolResponse {
        private Long id;
        private String nombre;
        private String descripcion;
    }
}