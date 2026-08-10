package com.voltiosyruedas.taller.taller.entity;

import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.reservas.entity.Reserva;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ordenes_trabajo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrdenTrabajo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reserva_id", unique = true)
    private Reserva reserva;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Usuario cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mecanico_id")
    private Usuario mecanico;

    @Column(name = "numero_orden", nullable = false, unique = true, length = 50)
    private String numeroOrden;

    @Column(name = "descripcion_problema", nullable = false, columnDefinition = "TEXT")
    private String descripcionProblema;

    @Column(columnDefinition = "TEXT")
    private String diagnostico;

    @Column(name = "solucion_aplicada", columnDefinition = "TEXT")
    private String solucionAplicada;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String estado = "RECIEN_INGRESADO";

    @Column(name = "fecha_ingreso", nullable = false)
    private LocalDateTime fechaIngreso;

    @Column(name = "fecha_estimada_entrega")
    private LocalDateTime fechaEstimadaEntrega;

    @Column(name = "fecha_entrega_real")
    private LocalDateTime fechaEntregaReal;

    @Column(name = "costo_mano_obra", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal costoManoObra = BigDecimal.ZERO;

    @Column(name = "costo_repuestos", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal costoRepuestos = BigDecimal.ZERO;

    @Column(name = "costo_total", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal costoTotal = BigDecimal.ZERO;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion;

    @OneToMany(mappedBy = "ordenTrabajo", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrdenTrabajoInventario> repuestosUtilizados = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
        fechaActualizacion = LocalDateTime.now();
        if (fechaIngreso == null) {
            fechaIngreso = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }

    public enum EstadoOrden {
        RECIEN_INGRESADO,
        POR_INGRESAR,
        TRABAJANDO,
        TERMINADO,
        ENTREGADO
    }
}