package com.voltiosyruedas.taller.reservas.dto;

import com.voltiosyruedas.taller.auth.dto.UsuarioResponse;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservaResponse {
    private Long id;
    private UsuarioResponse cliente;
    private LocalDateTime fechaHora;
    private String descripcion;
    private String categoriaServicio;
    private String estado;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
}