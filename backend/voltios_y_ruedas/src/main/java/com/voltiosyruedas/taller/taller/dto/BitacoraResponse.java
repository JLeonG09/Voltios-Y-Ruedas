package com.voltiosyruedas.taller.taller.dto;

import com.voltiosyruedas.taller.auth.dto.UsuarioResponse;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BitacoraResponse {
    private Long id;
    private Long ordenTrabajoId;
    private UsuarioResponse usuario;
    private String accion;
    private String descripcion;
    private String estadoAnterior;
    private String estadoNuevo;
    private LocalDateTime fecha;
}