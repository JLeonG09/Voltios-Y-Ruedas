package com.voltiosyruedas.taller.taller.dto;

import com.voltiosyruedas.taller.auth.dto.UsuarioResponse;
import com.voltiosyruedas.taller.reservas.dto.ReservaResponse;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrdenTrabajoResponse {
    private Long id;
    private ReservaResponse reserva;
    private UsuarioResponse cliente;
    private UsuarioResponse mecanico;
    private String numeroOrden;
    private String descripcionProblema;
    private String diagnostico;
    private String solucionAplicada;
    private String estado;
    private String estadoLabel;
    private LocalDateTime fechaIngreso;
    private LocalDateTime fechaEstimadaEntrega;
    private LocalDateTime fechaEntregaReal;
    private BigDecimal costoManoObra;
    private BigDecimal costoRepuestos;
    private BigDecimal costoTotal;
    private BigDecimal montoPagado;
    private BigDecimal saldoPendiente;
    private String estadoFacturacion;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    private List<OrdenTrabajoInventarioResponse> repuestosUtilizados;
    private List<BitacoraResponse> bitacora;
}