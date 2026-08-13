package com.voltiosyruedas.taller.taller.service;

import com.voltiosyruedas.taller.auth.entity.Usuario;
import org.springframework.security.access.AccessDeniedException;
import com.voltiosyruedas.taller.notificaciones.service.MailService;
import com.voltiosyruedas.taller.reservas.entity.Reserva;
import com.voltiosyruedas.taller.taller.dto.BitacoraResponse;
import com.voltiosyruedas.taller.taller.dto.OrdenTrabajoRequest;
import com.voltiosyruedas.taller.taller.dto.OrdenTrabajoResponse;
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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class OrdenTrabajoService {

    private static final Set<String> ROLES_STAFF = Set.of("ADMIN", "JEFE_TALLER", "MECANICO");

    private final OrdenTrabajoRepository ordenTrabajoRepository;
    private final ReservaRepository reservaRepository;
    private final com.voltiosyruedas.taller.auth.service.UsuarioService usuarioService;
    private final InventarioRepository inventarioRepository;
    private final OrdenTrabajoInventarioRepository ordenTrabajoInventarioRepository;
    private final BitacoraRepository bitacoraRepository;
    private final MailService mailService;

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
                .orElseThrow(() -> new RuntimeException("Orden de trabajo no encontrada con numero: " + numeroOrden));
    }

    @Transactional
    public OrdenTrabajo crear(Usuario solicitante, OrdenTrabajoRequest request) {
        boolean esStaff = esStaff(solicitante);
        if (!esStaff) {
            // El cliente no crea ordenes directamente: solo reserva. Pero permitimos
            // que un cliente genere una orden a partir de su reserva si la trae.
            throw new AccessDeniedException("Solo el personal del taller puede crear ordenes de trabajo");
        }
        if (ordenTrabajoRepository.findByNumeroOrden(request.getNumeroOrden()).isPresent()) {
            throw new RuntimeException("Ya existe una orden con ese numero");
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
        OrdenTrabajo guardada = ordenTrabajoRepository.save(orden);
        registrarBitacora(guardada, solicitante, "CREACION",
                "Orden creada", null, guardada.getEstado());
        return guardada;
    }

    @Transactional
    public OrdenTrabajo actualizar(Usuario solicitante, Long id, OrdenTrabajoRequest request) {
        OrdenTrabajo orden = obtenerPorId(id);
        if (!esStaff(solicitante)) {
            throw new AccessDeniedException("Solo el personal del taller puede modificar ordenes");
        }
        String estadoAnterior = orden.getEstado();
        if (request.getMecanicoId() != null) {
            orden.setMecanico(usuarioService.obtenerPorId(request.getMecanicoId()));
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
        if (request.getFechaEstimadaEntrega() != null) {
            orden.setFechaEstimadaEntrega(request.getFechaEstimadaEntrega());
        }
        if (request.getCostoManoObra() != null) {
            orden.setCostoManoObra(request.getCostoManoObra());
        }
        if (request.getCostoRepuestos() != null) {
            orden.setCostoRepuestos(request.getCostoRepuestos());
        }
        if (request.getEstado() != null && !request.getEstado().equals(estadoAnterior)) {
            orden.setEstado(request.getEstado());
            if ("ENTREGADO".equals(request.getEstado())) {
                orden.setFechaEntregaReal(LocalDateTime.now());
            }
            registrarBitacora(orden, solicitante, "CAMBIO_ESTADO",
                    "Cambio de estado de " + estadoAnterior + " a " + request.getEstado(),
                    estadoAnterior, request.getEstado());
            notificarCambioEstado(orden, estadoAnterior, request.getEstado());
        }
        orden.setCostoTotal(orden.getCostoManoObra().add(orden.getCostoRepuestos()));
        return ordenTrabajoRepository.save(orden);
    }

    @Transactional
    public OrdenTrabajo cambiarEstado(Usuario solicitante, Long id, String nuevoEstado) {
        if (!esStaff(solicitante)) {
            throw new AccessDeniedException("Solo el personal del taller puede cambiar el estado");
        }
        OrdenTrabajo orden = obtenerPorId(id);
        String estadoAnterior = orden.getEstado();
        if (estadoAnterior.equals(nuevoEstado)) {
            return orden;
        }
        validarTransicionEstado(estadoAnterior, nuevoEstado);
        orden.setEstado(nuevoEstado);
        if ("ENTREGADO".equals(nuevoEstado)) {
            orden.setFechaEntregaReal(LocalDateTime.now());
        }
        OrdenTrabajo guardada = ordenTrabajoRepository.save(orden);
        registrarBitacora(guardada, solicitante, "CAMBIO_ESTADO",
                "Cambio de estado de " + estadoAnterior + " a " + nuevoEstado,
                estadoAnterior, nuevoEstado);
        notificarCambioEstado(guardada, estadoAnterior, nuevoEstado);
        return guardada;
    }

    @Transactional
    public void eliminar(Usuario solicitante, Long id) {
        if (solicitante.getRol() == null || !"ADMIN".equals(solicitante.getRol().getNombre())) {
            throw new AccessDeniedException("Solo el administrador puede eliminar ordenes");
        }
        OrdenTrabajo orden = obtenerPorId(id);
        ordenTrabajoRepository.delete(orden);
    }

    private void validarTransicionEstado(String actual, String nuevo) {
        if ("ENTREGADO".equals(actual) && !"ENTREGADO".equals(nuevo)) {
            throw new RuntimeException("No se puede cambiar el estado de una orden ya entregada");
        }
    }

    @Transactional
    public void agregarRepuesto(Usuario solicitante, Long ordenId, RepuestoOrdenRequest request) {
        if (!esStaff(solicitante)) {
            throw new AccessDeniedException("Solo el personal del taller puede agregar repuestos");
        }
        OrdenTrabajo orden = obtenerPorId(ordenId);
        Inventario inventario = inventarioRepository.findById(request.getInventarioId())
                .orElseThrow(() -> new RuntimeException("Repuesto no encontrado"));
        if (inventario.getStockActual() < request.getCantidad()) {
            throw new RuntimeException("Stock insuficiente para el repuesto: " + inventario.getNombre());
        }
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
            orden.getRepuestosUtilizados().add(nuevo);
        }
        inventario.setStockActual(inventario.getStockActual() - request.getCantidad());
        inventarioRepository.save(inventario);
        actualizarCostosOrden(orden);
        registrarBitacora(orden, solicitante, "REPUESTO_AGREGADO",
                "Repuesto " + inventario.getCodigo() + " x" + request.getCantidad(),
                null, null);
    }

    @Transactional
    public void quitarRepuesto(Usuario solicitante, Long ordenId, Long inventarioId) {
        if (!esStaff(solicitante)) {
            throw new AccessDeniedException("Solo el personal del taller puede quitar repuestos");
        }
        OrdenTrabajo orden = obtenerPorId(ordenId);
        Inventario inventario = inventarioRepository.findById(inventarioId)
                .orElseThrow(() -> new RuntimeException("Repuesto no encontrado"));
        var itemOpt = ordenTrabajoInventarioRepository
                .findByOrdenTrabajoAndInventario(orden, inventario);
        if (itemOpt.isEmpty()) {
            throw new RuntimeException("El repuesto no esta en esta orden");
        }
        OrdenTrabajoInventario item = itemOpt.get();
        inventario.setStockActual(inventario.getStockActual() + item.getCantidad());
        inventarioRepository.save(inventario);
        ordenTrabajoInventarioRepository.delete(item);
        orden.getRepuestosUtilizados().remove(item);
        actualizarCostosOrden(orden);
        registrarBitacora(orden, solicitante, "REPUESTO_QUITADO",
                "Repuesto " + inventario.getCodigo() + " devuelto al inventario",
                null, null);
    }

    private void actualizarCostosOrden(OrdenTrabajo orden) {
        BigDecimal totalRepuestos = ordenTrabajoInventarioRepository
                .findByOrdenTrabajo(orden).stream()
                .map(item -> item.getPrecioUnitario()
                        .multiply(BigDecimal.valueOf(item.getCantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        orden.setCostoRepuestos(totalRepuestos);
        orden.setCostoTotal(orden.getCostoManoObra().add(totalRepuestos));
        ordenTrabajoRepository.save(orden);
    }

    private void registrarBitacora(OrdenTrabajo orden, Usuario autor, String accion,
                                   String descripcion, String estadoAnterior, String estadoNuevo) {
        Bitacora bitacora = Bitacora.builder()
                .ordenTrabajo(orden)
                .usuario(autor != null ? autor : (orden.getMecanico() != null ? orden.getMecanico() : orden.getCliente()))
                .accion(accion)
                .descripcion(descripcion)
                .estadoAnterior(estadoAnterior)
                .estadoNuevo(estadoNuevo)
                .fecha(LocalDateTime.now())
                .build();
        bitacoraRepository.save(bitacora);
    }

    /** Emails por cambio de estado de orden de trabajo. */
    private void notificarCambioEstado(OrdenTrabajo orden, String estadoAnterior, String estadoNuevo) {
        if ("TRABAJANDO".equals(estadoNuevo)) {
            // Vehículo en trabajo: aviso al jefe de taller y al cliente.
            mailService.notificarTrabajoVehiculo(orden);
        } else {
            // Resto de cambios: notifica al cliente.
            mailService.notificarCambioEstadoOrden(orden, estadoAnterior, estadoNuevo);
        }
    }

    public List<Bitacora> obtenerBitacora(Long ordenId) {
        OrdenTrabajo orden = obtenerPorId(ordenId);
        return bitacoraRepository.findByOrdenTrabajoOrderByFechaDesc(orden);
    }

    /**
     * Construye la respuesta con datos de facturacion embebidos.
     * Por ahora montoPagado=0, saldoPendiente=costoTotal, estadoFacturacion segun estado.
     */
    public OrdenTrabajoResponse mapearRespuesta(OrdenTrabajo orden, boolean incluirBitacora) {
        BigDecimal montoPagado = BigDecimal.ZERO; // TODO cuando exista modulo de pagos
        BigDecimal saldo = orden.getCostoTotal() != null
                ? orden.getCostoTotal().subtract(montoPagado)
                : BigDecimal.ZERO;
        String estadoFacturacion;
        if (saldo.compareTo(BigDecimal.ZERO) == 0 && orden.getCostoTotal() != null
                && orden.getCostoTotal().compareTo(BigDecimal.ZERO) > 0) {
            estadoFacturacion = "PAGADO";
        } else if ("ENTREGADO".equals(orden.getEstado())) {
            estadoFacturacion = "PENDIENTE_PAGO";
        } else {
            estadoFacturacion = "NO_FACTURADO";
        }
        return OrdenTrabajoResponse.builder()
                .id(orden.getId())
                .numeroOrden(orden.getNumeroOrden())
                .estado(orden.getEstado())
                .estadoLabel(estadoLabel(orden.getEstado()))
                .cliente(usuarioToResponse(orden.getCliente()))
                .mecanico(usuarioToResponse(orden.getMecanico()))
                .descripcionProblema(orden.getDescripcionProblema())
                .diagnostico(orden.getDiagnostico())
                .solucionAplicada(orden.getSolucionAplicada())
                .fechaIngreso(orden.getFechaIngreso())
                .fechaEstimadaEntrega(orden.getFechaEstimadaEntrega())
                .fechaEntregaReal(orden.getFechaEntregaReal())
                .costoManoObra(orden.getCostoManoObra())
                .costoRepuestos(orden.getCostoRepuestos())
                .costoTotal(orden.getCostoTotal())
                .montoPagado(montoPagado)
                .saldoPendiente(saldo)
                .estadoFacturacion(estadoFacturacion)
                .fechaCreacion(orden.getFechaCreacion())
                .fechaActualizacion(orden.getFechaActualizacion())
                .repuestosUtilizados(orden.getRepuestosUtilizados().stream().map(this::mapRepuesto).toList())
                .bitacora(incluirBitacora
                        ? bitacoraRepository.findByOrdenTrabajoOrderByFechaDesc(orden).stream().map(this::mapBitacora).toList()
                        : null)
                .build();
    }

    private com.voltiosyruedas.taller.taller.dto.OrdenTrabajoInventarioResponse mapRepuesto(OrdenTrabajoInventario item) {
        BigDecimal subtotal = item.getSubtotal() != null
                ? item.getSubtotal()
                : item.getPrecioUnitario().multiply(BigDecimal.valueOf(item.getCantidad()));
        return com.voltiosyruedas.taller.taller.dto.OrdenTrabajoInventarioResponse.builder()
                .id(item.getId())
                .cantidad(item.getCantidad())
                .precioUnitario(item.getPrecioUnitario())
                .subtotal(subtotal)
                .fechaCreacion(item.getFechaCreacion())
                .build();
    }

    public BitacoraResponse mapBitacora(Bitacora bitacora) {
        return BitacoraResponse.builder()
                .id(bitacora.getId())
                .ordenTrabajoId(bitacora.getOrdenTrabajo() != null ? bitacora.getOrdenTrabajo().getId() : null)
                .usuario(usuarioToResponse(bitacora.getUsuario()))
                .accion(bitacora.getAccion())
                .descripcion(bitacora.getDescripcion())
                .estadoAnterior(bitacora.getEstadoAnterior())
                .estadoNuevo(bitacora.getEstadoNuevo())
                .fecha(bitacora.getFecha())
                .build();
    }

    private com.voltiosyruedas.taller.auth.dto.UsuarioResponse usuarioToResponse(Usuario u) {
        if (u == null) return null;
        return com.voltiosyruedas.taller.auth.dto.UsuarioResponse.builder()
                .id(u.getId())
                .nombre(u.getNombre())
                .apellido(u.getApellido())
                .email(u.getEmail())
                .telefono(u.getTelefono())
                .direccion(u.getDireccion())
                .activo(u.getActivo())
                .fechaCreacion(u.getFechaCreacion())
                .fechaActualizacion(u.getFechaActualizacion())
                .rol(u.getRol() != null
                        ? com.voltiosyruedas.taller.auth.dto.UsuarioResponse.RolResponse.builder()
                                .id(u.getRol().getId())
                                .nombre(u.getRol().getNombre())
                                .descripcion(u.getRol().getDescripcion())
                                .build()
                        : null)
                .build();
    }

    private String estadoLabel(String estado) {
        if (estado == null) return "";
        return switch (estado) {
            case "RECIEN_INGRESADO" -> "Recien ingresado";
            case "POR_INGRESAR" -> "Por ingresar";
            case "TRABAJANDO" -> "Trabajando";
            case "TERMINADO" -> "Terminado";
            case "ENTREGADO" -> "Entregado";
            default -> estado;
        };
    }

    public boolean esStaff(Usuario usuario) {
        return usuario != null && usuario.getRol() != null
                && ROLES_STAFF.contains(usuario.getRol().getNombre());
    }

    public Usuario usuarioActual() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return principal instanceof Usuario u ? u : null;
    }
}
