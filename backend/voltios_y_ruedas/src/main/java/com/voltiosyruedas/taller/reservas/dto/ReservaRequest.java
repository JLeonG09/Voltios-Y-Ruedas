package com.voltiosyruedas.taller.reservas.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservaRequest {
    @NotNull(message = "La fecha y hora son obligatorias")
    private LocalDateTime fechaHora;

    @Size(max = 100, message = "La categoría no puede exceder 100 caracteres")
    private String categoriaServicio;

    @Size(max = 1000, message = "La descripción no puede exceder 1000 caracteres")
    private String descripcion;
}