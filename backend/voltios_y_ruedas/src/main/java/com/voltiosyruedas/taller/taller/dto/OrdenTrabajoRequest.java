package com.voltiosyruedas.taller.taller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrdenTrabajoRequest {
    private Long reservaId;

    @NotNull(message = "El cliente es obligatorio")
    private Long clienteId;

    private Long mecanicoId;

    @NotBlank(message = "El número de orden es obligatorio")
    @Size(max = 50, message = "El número de orden no puede exceder 50 caracteres")
    private String numeroOrden;

    @NotBlank(message = "La descripción del problema es obligatoria")
    @Size(max = 2000, message = "La descripción no puede exceder 2000 caracteres")
    private String descripcionProblema;

    @Size(max = 2000, message = "El diagnóstico no puede exceder 2000 caracteres")
    private String diagnostico;

    @Size(max = 2000, message = "La solución aplicada no puede exceder 2000 caracteres")
    private String solucionAplicada;

    private String estado;

    private LocalDateTime fechaEstimadaEntrega;

    private BigDecimal costoManoObra;

    private BigDecimal costoRepuestos;
}