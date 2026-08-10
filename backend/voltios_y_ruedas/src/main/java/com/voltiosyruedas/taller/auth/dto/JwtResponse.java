package com.voltiosyruedas.taller.auth.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JwtResponse {
    private String token;
    @Builder.Default
    private String tipo = "Bearer";
    private Long id;
    private String nombre;
    private String apellido;
    private String email;
    private String rol;

    public String getNombreCompleto() {
        return nombre + " " + apellido;
    }
}