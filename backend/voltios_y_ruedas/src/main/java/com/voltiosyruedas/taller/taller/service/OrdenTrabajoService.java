package com.voltiosyruedas.taller.taller.service;

import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.reservas.entity.Reserva;
import com.voltiosyruedas.taller.taller.dto.OrdenTrabajoRequest;
import com.voltiosyruedas.taller.taller.dto.RepuestoOrdenRequest;
import com.voltiosyruedas.taller.taller.entity.Bitacora;
import com.voltiosyruedas.taller.taller.entity.OrdenTrabajo;
import com.voltiosyruedas.taller.taller.entity.OrdenTrabajoInventario;
import com.voltiosyruedas.taller.taller.repository.BitacoraRepository;
import com.voltiosyruedas.taller.taller.repository.OrdenTrabajoInventarioRepository;
import com.voltiosyruedas.taller.taller.repository.OrdenTrabajoRepository;
import com.voltiosyruedas.taller.inventario.entity.Inventario;
import com.voltiosyruedas.taller.inventario.repository.InventarioRepository;
import com.voltiosyruedas.taller.reservas.repository.ReservaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrdenTrabajoService {

    private final OrdenTrabajoRepository ordenTrabajoRepository;
    private final ReservaRepository reservaRepository;
    private final com.voltiosyruedas.taller.auth.service.UsuarioService usuarioService;
    private final InventarioRepository inventarioRepository;
    private final OrdenTrabajoInventarioRepository ordenTrabajoInventarioRepository;
    private final BitacoraRepository bitacoraRepository;

    public Page<OrdenTrabajo> listar(Pageable pageable) {
        return ordenTrabajoRepository.findAll(pageable);
    }

    public List<OrdenTrabajo> listarPorCliente(Usuario cliente) {
        return ordenTrabajoRepository.findByCliente(cliente);
    }

    public List<OrdenTrabajo> listarPorMecanico(Usuario mecanico) {
        return ordenTrabajoRepository.findByMecanico(mecanico);
    }

    public List<OrdenTrabajo> listarPorEstado(String estado) {
        return ordenTrabajoRepository.findByEstado(estado);
    }

    public OrdenTrabajo obtenerPorId(Long id) {
        return ordenTrabajoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Orden de trabajo no encontrada con ID: " + id));
    }

    public OrdenTrabajo obtenerPorNumeroOrden(String numeroOrden) {
        return ordenTrabajoRepository.findByNumeroOrden(numeroOrden)
                .orElseThrow(() -> new RuntimeException("Orden de trabajo no encontrada con número: " + numeroOrden));
    }

    @Transactional
    public OrdenTrabajo crear(OrdenTrabajoRequest request) {
        if (ordenTrabajoRepository.findByNumeroOrden(request.getNumeroOrden()).isPresent()) {
            throw new RuntimeException("Ya existe una orden con ese número");
        }

        Usuario cliente = usuarioService.obtenerPorId(request.getClienteId());
        
        Usuario mecanico = null;
        if (request.getMecanicoId() != null) {
            mecanico = usuarioService.obtenerPorId(request.getMecanicoId());
        }

        Reserva reserva = null;
        if (request.getReservaId() != null) {
            reserva = reservaRepository.findById(request.getReservaId())
                    .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));
        }

        OrdenTrabajo orden = OrdenTrabajo.builder()
                .reserva(reserva)
                .cliente(cliente)
                .mecanico(mecanico)
                .numeroOrden(request.getNumeroOrden())
                .descripcionProblema(request.getDescripcionProblema())
                .diagnostico(request.getDiagnostico())
                .solucionAplicada(request.getSolucionAplicada())
                .estado(request.getEstado() != null ? request.getEstado() : "RECIEN_INGRESADO")
                .fechaEstimadaEntrega(request.getFechaEstimadaEntrega())
                .costoManoObra(request.getCostoManoObra() != null ? request.getCostoManoObra() : BigDecimal.ZERO)
                .costoRepuestos(request.getCostoRepuestos() != null ? request.getCostoRepuestos() : BigDecimal.ZERO)
                .build();

        orden.setCostoTotal(orden.getCostoManoObra().add(orden.getCostoRepuestos()));

        return ordenTrabajoRepository.save(orden);
    }

    @Transactional
    public OrdenTrabajo actualizar(Long id, OrdenTrabajoRequest request) {
        OrdenTrabajo orden = obtenerPorId(id);
        
        if (request.getMecanicoId() != null) {
            Usuario mecanico = usuarioService.obtenerPorId(request.getMecanicoId());
            orden.setMecanico(mecanico);
        }

        if (request.getDescripcionProblema() != null) {
            orden.setDescripcionProblema(request.getDescripcionProblema());
        }
        if (request.getDiagnostico() != null) {
            orden.setDiagnostico(request.getDiagnostico());
        }
        if (request.getSolucionAplicada() != null) {
            orden.setSolucionAplicada(request.getSolucionAplicada());
        }
        if (request.getEstado() != null) {
            cambiarEstado(id, request.getEstado());
        }
        if (request.getFechaEstimadaEntrega() != null) {
            orden.setFechaEstimadaEntrega(request.getFechaEstimadaEntrega());
        }
        if (request.getCostoManoObra() != null) {
            orden.setCostoManoObra(request.getCostoManoObra());
        }
        if (request.getCostoRepuestos() != null) {
            orden.setCostoRepuestos(request.getCostoRepuestos());
        }
        
        orden.setCostoTotal(orden.getCostoManoObra().add(orden.getCostoRepuestos()));

        return ordenTrabajoRepository.save(orden);
    }

    @Transactional
    public OrdenTrabajo cambiarEstado(Long id, String nuevoEstado) {
        OrdenTrabajo orden = obtenerPorId(id);
        String estadoAnterior = orden.getEstado();
        
        if (estadoAnterior.equals(nuevoEstado)) {
            return orden;
        }

        // Validar transición de estados
        validarTransicionEstado(estadoAnterior, nuevoEstado);

        orden.setEstado(nuevoEstado);
        
        if ("ENTREGADO".equals(nuevoEstado)) {
            orden.setFechaEntregaReal(LocalDateTime.now());
        }

        ordenTrabajoRepository.save(orden);

        // Registrar en bitácora
        registrarBitacora(orden, "CAMBIO_ESTADO", 
                "Cambio de estado de " + estadoAnterior + " a " + nuevoEstado,
                estadoAnterior, nuevoEstado);

        return orden;
    }

    private void validarTransicionEstado(String actual, String nuevo) {
        // Validaciones básicas de transición
        if ("ENTREGADO".equals(actual) && !"ENTREGADO".equals(nuevo)) {
            throw new RuntimeException("No se puede cambiar el estado de una orden ya entregada");
        }
    }

    @Transactional
    public void agregarRepuesto(Long ordenId, RepuestoOrdenRequest request) {
        OrdenTrabajo orden = obtenerPorId(ordenId);
        Inventario inventario = inventarioRepository.findById(request.getInventarioId())
                .orElseThrow(() -> new RuntimeException("Repuesto no encontrado"));

        if (inventario.getStockActual() < request.getCantidad()) {
            throw new RuntimeException("Stock insuficiente para el repuesto: " + inventario.getNombre());
        }

        // Verificar si ya existe
        var existenteOpt = ordenTrabajoInventarioRepository
                .findByOrdenTrabajoAndInventario(orden, inventario);

        if (existenteOpt.isPresent()) {
            OrdenTrabajoInventario existente = existenteOpt.get();
            existente.setCantidad(existente.getCantidad() + request.getCantidad());
            existente.setPrecioUnitario(request.getPrecioUnitario());
            ordenTrabajoInventarioRepository.save(existente);
        } else {
            OrdenTrabajoInventario nuevo = OrdenTrabajoInventario.builder()
                    .ordenTrabajo(orden)
                    .inventario(inventario)
                    .cantidad(request.getCantidad())
                    .precioUnitario(request.getPrecioUnitario())
                    .build();
            ordenTrabajoInventarioRepository.save(nuevo);
        }

        // Actualizar stock
        inventario.setStockActual(inventario.getStockActual() - request.getCantidad());
        inventarioRepository.save(inventario);

        // Actualizar costo total de la orden
        actualizarCostosOrden(orden);
    }

    @Transactional
    public void quitarRepuesto(Long ordenId, Long inventarioId) {
        OrdenTrabajo orden = obtenerPorId(ordenId);
        Inventario inventario = inventarioRepository.findById(inventarioId)
                .orElseThrow(() -> new RuntimeException("Repuesto no encontrado"));

        var itemOpt = ordenTrabajoInventarioRepository
                .findByOrdenTrabajoAndInventario(orden, inventario);

        if (itemOpt.isEmpty()) {
            throw new RuntimeException("El repuesto no está en esta orden");
        }
        OrdenTrabajoInventario item = itemOpt.get();

        // Devolver stock
        inventario.setStockActual(inventario.getStockActual() + item.getCantidad());
        inventarioRepository.save(inventario);

        ordenTrabajoInventarioRepository.delete(item);

        // Actualizar costo total
        actualizarCostosOrden(orden);
    }

    private void actualizarCostosOrden(OrdenTrabajo orden) {
        BigDecimal totalRepuestos = ordenTrabajoInventarioRepository
                .findByOrdenTrabajo(orden).stream()
                .map(OrdenTrabajoInventario::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        orden.setCostoRepuestos(totalRepuestos);
        orden.setCostoTotal(orden.getCostoManoObra().add(totalRepuestos));
        ordenTrabajoRepository.save(orden);
    }

    private void registrarBitacora(OrdenTrabajo orden, String accion, String descripcion, 
                                   String estadoAnterior, String estadoNuevo) {
        // This would need the current user from security context
        Bitacora bitacora = Bitacora.builder()
                .ordenTrabajo(orden)
                .usuario(orden.getMecanico() != null ? orden.getMecanico() : orden.getCliente())
                .accion(accion)
                .descripcion(descripcion)
                .estadoAnterior(estadoAnterior)
                .estadoNuevo(estadoNuevo)
                .build();
        bitacoraRepository.save(bitacora);
    }

    public List<Bitacora> obtenerBitacora(Long ordenId) {
        OrdenTrabajo orden = obtenerPorId(ordenId);
        return bitacoraRepository.findByOrdenTrabajoOrderByFechaDesc(orden);
    }
}