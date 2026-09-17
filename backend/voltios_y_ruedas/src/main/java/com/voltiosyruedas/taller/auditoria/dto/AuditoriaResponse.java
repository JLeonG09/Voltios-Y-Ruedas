package com.voltiosyruedas.taller.auditoria.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditoriaResponse {
    private Long id;
    private Long usuarioId;
    private String usuarioEmail;
    private String accion;
    private String entidad;
    private Long entidadId;
    private String detalle;
    private String ip;
    private LocalDateTime fecha;
}
