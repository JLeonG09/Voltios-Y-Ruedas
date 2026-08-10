package com.voltiosyruedas.taller.taller.entity;

import com.voltiosyruedas.taller.auth.entity.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "bitacoras")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bitacora {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "orden_trabajo_id", nullable = false)
    private OrdenTrabajo ordenTrabajo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, length = 100)
    private String accion;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "estado_anterior", length = 50)
    private String estadoAnterior;

    @Column(name = "estado_nuevo", length = 50)
    private String estadoNuevo;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @PrePersist
    protected void onCreate() {
        fecha = LocalDateTime.now();
    }
}