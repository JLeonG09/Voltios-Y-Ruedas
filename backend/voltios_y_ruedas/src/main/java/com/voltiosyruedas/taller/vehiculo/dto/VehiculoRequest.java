package com.voltiosyruedas.taller.vehiculo.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehiculoRequest {

    @NotBlank(message = "La placa es obligatoria")
    @Size(min = 4, max = 20, message = "La placa debe tener entre 4 y 20 caracteres")
    private String placa;

    @NotBlank(message = "La marca es obligatoria")
    @Size(max = 80, message = "La marca no puede exceder 80 caracteres")
    private String marca;

    @NotBlank(message = "El modelo es obligatorio")
    @Size(max = 80, message = "El modelo no puede exceder 80 caracteres")
    private String modelo;

    @Min(value = 1900, message = "El anio no puede ser menor a 1900")
    @Max(value = 2100, message = "El anio no puede ser mayor a 2100")
    private Integer anio;

    @Size(max = 40, message = "El color no puede exceder 40 caracteres")
    private String color;

    @Min(value = 0, message = "El kilometraje no puede ser negativo")
    private Integer kilometraje;

    @Size(max = 1000, message = "Las notas no pueden exceder 1000 caracteres")
    private String notas;

    private String estado;

    /**
     * Solo el staff puede asignar el cliente. Los clientes se autoregistran
     * con su propio ID desde el contexto de seguridad.
     */
    private Long clienteId;
}
