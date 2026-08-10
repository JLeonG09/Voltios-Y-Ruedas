package com.voltiosyruedas.taller.inventario.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventarioRequest {
    @NotBlank(message = "El código es obligatorio")
    @Size(max = 50, message = "El código no puede exceder 50 caracteres")
    private String codigo;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150, message = "El nombre no puede exceder 150 caracteres")
    private String nombre;

    @Size(max = 1000, message = "La descripción no puede exceder 1000 caracteres")
    private String descripcion;

    @Size(max = 100, message = "La categoría no puede exceder 100 caracteres")
    private String categoria;

    @Size(max = 100, message = "La marca no puede exceder 100 caracteres")
    private String marca;

    @Size(max = 100, message = "El modelo no puede exceder 100 caracteres")
    private String modelo;

    @Min(value = 0, message = "El stock actual no puede ser negativo")
    private Integer stockActual;

    @Min(value = 0, message = "El stock mínimo no puede ser negativo")
    private Integer stockMinimo;

    @NotNull(message = "El precio de compra es obligatorio")
    @DecimalMin(value = "0.0", inclusive = true, message = "El precio de compra no puede ser negativo")
    private BigDecimal precioCompra;

    @NotNull(message = "El precio de venta es obligatorio")
    @DecimalMin(value = "0.0", inclusive = true, message = "El precio de venta no puede ser negativo")
    private BigDecimal precioVenta;

    @Size(max = 100, message = "La ubicación no puede exceder 100 caracteres")
    private String ubicacion;

    @Size(max = 150, message = "El proveedor no puede exceder 150 caracteres")
    private String proveedor;

    private Boolean activo;
}