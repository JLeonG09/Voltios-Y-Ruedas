package com.voltiosyruedas.taller.vehiculo.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehiculoResponse {
    private Long id;
    private Long clienteId;
    private String clienteNombre;
    private String placa;
    private String marca;
    private String modelo;
    private Integer anio;
    private String color;
    private Integer kilometraje;
    private String estado;
    private String estadoLabel;
    private String notas;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
}
