package com.voltiosyruedas.taller.taller.dto;

import com.voltiosyruedas.taller.inventario.dto.InventarioResponse;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrdenTrabajoInventarioResponse {
    private Long id;
    private InventarioResponse inventario;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;
    private LocalDateTime fechaCreacion;
}