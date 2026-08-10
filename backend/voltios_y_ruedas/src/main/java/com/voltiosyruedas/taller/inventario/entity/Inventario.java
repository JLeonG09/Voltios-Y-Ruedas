package com.voltiosyruedas.taller.inventario.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String codigo;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(length = 100)
    private String categoria;

    @Column(length = 100)
    private String marca;

    @Column(length = 100)
    private String modelo;

    @Column(name = "stock_actual", nullable = false)
    @Builder.Default
    private Integer stockActual = 0;

    @Column(name = "stock_minimo", nullable = false)
    @Builder.Default
    private Integer stockMinimo = 5;

    @Column(name = "precio_compra", precision = 10, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal precioCompra = BigDecimal.ZERO;

    @Column(name = "precio_venta", precision = 10, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal precioVenta = BigDecimal.ZERO;

    @Column(length = 100)
    private String ubicacion;

    @Column(length = 150)
    private String proveedor;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion;

    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
        fechaActualizacion = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }

    public boolean isStockBajo() {
        return stockActual <= stockMinimo;
    }
}