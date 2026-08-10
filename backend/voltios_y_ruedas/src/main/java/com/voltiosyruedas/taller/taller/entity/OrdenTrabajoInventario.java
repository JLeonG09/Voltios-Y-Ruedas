package com.voltiosyruedas.taller.taller.entity;

import com.voltiosyruedas.taller.inventario.entity.Inventario;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ordenes_trabajo_inventario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrdenTrabajoInventario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "orden_trabajo_id", nullable = false)
    private OrdenTrabajo ordenTrabajo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventario_id", nullable = false)
    private Inventario inventario;

    @Column(nullable = false)
    @Builder.Default
    private Integer cantidad = 1;

    @Column(name = "precio_unitario", precision = 10, scale = 2, nullable = false)
    private BigDecimal precioUnitario;

    @Column(name = "subtotal", precision = 10, scale = 2, insertable = false, updatable = false)
    private BigDecimal subtotal;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
    }
}