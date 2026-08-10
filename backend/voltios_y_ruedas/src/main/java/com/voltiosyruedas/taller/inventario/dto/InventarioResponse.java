package com.voltiosyruedas.taller.inventario.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventarioResponse {
    private Long id;
    private String codigo;
    private String nombre;
    private String descripcion;
    private String categoria;
    private String marca;
    private String modelo;
    private Integer stockActual;
    private Integer stockMinimo;
    private BigDecimal precioCompra;
    private BigDecimal precioVenta;
    private String ubicacion;
    private String proveedor;
    private Boolean activo;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;

    public boolean isStockBajo() {
        return stockActual != null && stockMinimo != null && stockActual <= stockMinimo;
    }
}