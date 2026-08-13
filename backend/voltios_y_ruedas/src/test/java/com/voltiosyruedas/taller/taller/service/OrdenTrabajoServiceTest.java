package com.voltiosyruedas.taller.taller.service;

import com.voltiosyruedas.taller.auth.entity.Rol;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.auth.service.UsuarioService;
import com.voltiosyruedas.taller.inventario.entity.Inventario;
import com.voltiosyruedas.taller.inventario.repository.InventarioRepository;
import com.voltiosyruedas.taller.notificaciones.service.MailService;
import com.voltiosyruedas.taller.reservas.entity.Reserva;
import com.voltiosyruedas.taller.reservas.repository.ReservaRepository;
import com.voltiosyruedas.taller.taller.dto.OrdenTrabajoRequest;
import com.voltiosyruedas.taller.taller.dto.RepuestoOrdenRequest;
import com.voltiosyruedas.taller.taller.entity.Bitacora;
import com.voltiosyruedas.taller.taller.entity.OrdenTrabajo;
import com.voltiosyruedas.taller.taller.entity.OrdenTrabajoInventario;
import com.voltiosyruedas.taller.taller.repository.BitacoraRepository;
import com.voltiosyruedas.taller.taller.repository.OrdenTrabajoInventarioRepository;
import com.voltiosyruedas.taller.taller.repository.OrdenTrabajoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrdenTrabajoServiceTest {

    @Mock
    private OrdenTrabajoRepository ordenTrabajoRepository;

    @Mock
    private ReservaRepository reservaRepository;

    @Mock
    private UsuarioService usuarioService;

    @Mock
    private InventarioRepository inventarioRepository;

    @Mock
    private OrdenTrabajoInventarioRepository ordenTrabajoInventarioRepository;

    @Mock
    private BitacoraRepository bitacoraRepository;

    @Mock
    private MailService mailService;

    @InjectMocks
    private OrdenTrabajoService ordenTrabajoService;

    private Usuario cliente;
    private Usuario mecanico;
    private Usuario admin;
    private Rol rolCliente;
    private Rol rolMecanico;
    private Rol rolAdmin;
    private Reserva reserva;
    private Inventario repuesto;
    private OrdenTrabajoRequest request;
    private OrdenTrabajo orden;

    @BeforeEach
    void setUp() {
        rolCliente = new Rol(4L, "CLIENTE", "Cliente del taller");
        rolMecanico = new Rol(3L, "MECANICO", "Mecanico del taller");
        rolAdmin = new Rol(1L, "ADMIN", "Administrador");

        cliente = Usuario.builder()
                .id(1L).nombre("Juan").apellido("Perez").email("juan.perez@test.com")
                .password("encodedPassword").rol(rolCliente).activo(true).build();

        mecanico = Usuario.builder()
                .id(2L).nombre("Carlos").apellido("Mecanico").email("carlos.mecanico@test.com")
                .password("encodedPassword").rol(rolMecanico).activo(true).build();

        admin = Usuario.builder()
                .id(99L).nombre("Admin").apellido("Root").email("admin@test.com")
                .password("encodedPassword").rol(rolAdmin).activo(true).build();

        reserva = Reserva.builder()
                .id(1L).cliente(cliente).fechaHora(LocalDateTime.now().plusDays(1))
                .descripcion("Cambio de aceite").categoriaServicio("Mantenimiento").estado("PENDIENTE").build();

        repuesto = Inventario.builder()
                .id(1L).codigo("REP-001").nombre("Filtro de aceite").categoria("Filtros")
                .stockActual(20).stockMinimo(5)
                .precioCompra(new BigDecimal("15.00")).precioVenta(new BigDecimal("25.00")).activo(true).build();

        request = OrdenTrabajoRequest.builder()
                .numeroOrden("OT-001").clienteId(1L).mecanicoId(2L).reservaId(1L)
                .descripcionProblema("Ruido en motor").diagnostico("Filtro sucio")
                .solucionAplicada("Cambio de filtro")
                .fechaEstimadaEntrega(LocalDateTime.now().plusDays(2))
                .costoManoObra(new BigDecimal("50.00")).costoRepuestos(BigDecimal.ZERO).build();

        orden = OrdenTrabajo.builder()
                .id(1L).numeroOrden("OT-001").cliente(cliente).mecanico(mecanico).reserva(reserva)
                .descripcionProblema("Ruido en motor").diagnostico("Filtro sucio")
                .solucionAplicada("Cambio de filtro").estado("RECIEN_INGRESADO")
                .fechaEstimadaEntrega(LocalDateTime.now().plusDays(2))
                .costoManoObra(new BigDecimal("50.00")).costoRepuestos(BigDecimal.ZERO)
                .costoTotal(new BigDecimal("50.00")).build();
    }

    @Test
    void crear_deberiaCrearOrdenConEstadoRecienIngresado() {
        when(ordenTrabajoRepository.findByNumeroOrden("OT-001")).thenReturn(Optional.empty());
        when(usuarioService.obtenerPorId(1L)).thenReturn(cliente);
        when(usuarioService.obtenerPorId(2L)).thenReturn(mecanico);
        when(reservaRepository.findById(1L)).thenReturn(Optional.of(reserva));
        when(ordenTrabajoRepository.save(any(OrdenTrabajo.class))).thenAnswer(inv -> {
            OrdenTrabajo o = inv.getArgument(0);
            o.setId(1L);
            return o;
        });
        when(bitacoraRepository.save(any(Bitacora.class))).thenAnswer(inv -> inv.getArgument(0));

        OrdenTrabajo resultado = ordenTrabajoService.crear(admin, request);

        assertThat(resultado).isNotNull();
        assertThat(resultado.getNumeroOrden()).isEqualTo("OT-001");
        assertThat(resultado.getCliente()).isEqualTo(cliente);
        assertThat(resultado.getMecanico()).isEqualTo(mecanico);
        assertThat(resultado.getReserva()).isEqualTo(reserva);
        assertThat(resultado.getEstado()).isEqualTo("RECIEN_INGRESADO");
        assertThat(resultado.getCostoTotal()).isEqualTo(new BigDecimal("50.00"));
        verify(ordenTrabajoRepository, times(1)).findByNumeroOrden("OT-001");
        verify(ordenTrabajoRepository, times(1)).save(any(OrdenTrabajo.class));
    }

    @Test
    void crear_numeroOrdenDuplicado_deberiaLanzarExcepcion() {
        when(ordenTrabajoRepository.findByNumeroOrden("OT-001")).thenReturn(Optional.of(orden));

        assertThatThrownBy(() -> ordenTrabajoService.crear(admin, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Ya existe una orden con ese numero");
    }

    @Test
    void crear_clienteNoExiste_deberiaLanzarExcepcion() {
        when(ordenTrabajoRepository.findByNumeroOrden("OT-001")).thenReturn(Optional.empty());
        when(usuarioService.obtenerPorId(1L)).thenThrow(new RuntimeException("Usuario no encontrado con ID: 1"));

        assertThatThrownBy(() -> ordenTrabajoService.crear(admin, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Usuario no encontrado con ID: 1");
    }

    @Test
    void crear_comoCliente_deberiaLanzarAccessDenied() {
        assertThatThrownBy(() -> ordenTrabajoService.crear(cliente, request))
                .isInstanceOf(AccessDeniedException.class);
        verify(ordenTrabajoRepository, never()).save(any(OrdenTrabajo.class));
    }

    @Test
    void listar_deberiaRetornarPaginaDeOrdenes() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<OrdenTrabajo> page = new PageImpl<>(List.of(orden, orden), pageable, 2);
        when(ordenTrabajoRepository.findAll(pageable)).thenReturn(page);

        Page<OrdenTrabajo> resultado = ordenTrabajoService.listar(pageable);

        assertThat(resultado.getTotalElements()).isEqualTo(2);
        verify(ordenTrabajoRepository, times(1)).findAll(pageable);
    }

    @Test
    void listarPorCliente_deberiaRetornarOrdenesDelCliente() {
        when(ordenTrabajoRepository.findByCliente(cliente)).thenReturn(List.of(orden, orden));
        List<OrdenTrabajo> resultado = ordenTrabajoService.listarPorCliente(cliente);
        assertThat(resultado).hasSize(2);
        verify(ordenTrabajoRepository, times(1)).findByCliente(cliente);
    }

    @Test
    void listarPorMecanico_deberiaRetornarOrdenesDelMecanico() {
        when(ordenTrabajoRepository.findByMecanico(mecanico)).thenReturn(List.of(orden));
        List<OrdenTrabajo> resultado = ordenTrabajoService.listarPorMecanico(mecanico);
        assertThat(resultado).hasSize(1);
    }

    @Test
    void listarPorEstado_deberiaRetornarOrdenesConEseEstado() {
        when(ordenTrabajoRepository.findByEstado("RECIEN_INGRESADO")).thenReturn(List.of(orden));
        List<OrdenTrabajo> resultado = ordenTrabajoService.listarPorEstado("RECIEN_INGRESADO");
        assertThat(resultado).hasSize(1);
    }

    @Test
    void obtenerPorId_existente_deberiaRetornarOrden() {
        when(ordenTrabajoRepository.findById(1L)).thenReturn(Optional.of(orden));
        OrdenTrabajo resultado = ordenTrabajoService.obtenerPorId(1L);
        assertThat(resultado.getId()).isEqualTo(1L);
    }

    @Test
    void obtenerPorId_inexistente_deberiaLanzarExcepcion() {
        when(ordenTrabajoRepository.findById(999L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> ordenTrabajoService.obtenerPorId(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Orden de trabajo no encontrada con ID: 999");
    }

    @Test
    void actualizar_deberiaModificarOrdenExistente() {
        OrdenTrabajoRequest updateRequest = OrdenTrabajoRequest.builder()
                .numeroOrden("OT-001").clienteId(1L).mecanicoId(2L)
                .descripcionProblema("Ruido en motor y transmision")
                .diagnostico("Filtro sucio y aceite viejo")
                .solucionAplicada("Cambio de filtro y aceite")
                .estado("TRABAJANDO")
                .fechaEstimadaEntrega(LocalDateTime.now().plusDays(3))
                .costoManoObra(new BigDecimal("75.00"))
                .costoRepuestos(new BigDecimal("25.00")).build();

        when(ordenTrabajoRepository.findById(1L)).thenReturn(Optional.of(orden));
        when(usuarioService.obtenerPorId(2L)).thenReturn(mecanico);
        when(ordenTrabajoRepository.save(any(OrdenTrabajo.class))).thenAnswer(inv -> inv.getArgument(0));
        when(bitacoraRepository.save(any(Bitacora.class))).thenAnswer(inv -> inv.getArgument(0));

        OrdenTrabajo resultado = ordenTrabajoService.actualizar(admin, 1L, updateRequest);

        assertThat(resultado.getDescripcionProblema()).isEqualTo("Ruido en motor y transmision");
        assertThat(resultado.getEstado()).isEqualTo("TRABAJANDO");
        assertThat(resultado.getCostoTotal()).isEqualTo(new BigDecimal("100.00"));
    }

    @Test
    void actualizar_comoCliente_deberiaLanzarAccessDenied() {
        when(ordenTrabajoRepository.findById(1L)).thenReturn(Optional.of(orden));
        assertThatThrownBy(() -> ordenTrabajoService.actualizar(cliente, 1L, request))
                .isInstanceOf(AccessDeniedException.class);
        verify(ordenTrabajoRepository, never()).save(any(OrdenTrabajo.class));
    }

    @Test
    void cambiarEstado_transicionValida_deberiaCambiarEstado() {
        when(ordenTrabajoRepository.findById(1L)).thenReturn(Optional.of(orden));
        when(ordenTrabajoRepository.save(any(OrdenTrabajo.class))).thenAnswer(inv -> inv.getArgument(0));
        when(bitacoraRepository.save(any(Bitacora.class))).thenAnswer(inv -> inv.getArgument(0));

        OrdenTrabajo resultado = ordenTrabajoService.cambiarEstado(admin, 1L, "TRABAJANDO");

        assertThat(resultado.getEstado()).isEqualTo("TRABAJANDO");
        verify(bitacoraRepository, times(1)).save(any(Bitacora.class));
    }

    @Test
    void cambiarEstado_aEntregado_deberiaPonerFechaEntregaReal() {
        when(ordenTrabajoRepository.findById(1L)).thenReturn(Optional.of(orden));
        when(ordenTrabajoRepository.save(any(OrdenTrabajo.class))).thenAnswer(inv -> inv.getArgument(0));
        when(bitacoraRepository.save(any(Bitacora.class))).thenAnswer(inv -> inv.getArgument(0));

        OrdenTrabajo resultado = ordenTrabajoService.cambiarEstado(admin, 1L, "ENTREGADO");

        assertThat(resultado.getEstado()).isEqualTo("ENTREGADO");
        assertThat(resultado.getFechaEntregaReal()).isNotNull();
    }

    @Test
    void cambiarEstado_transicionInvalida_deberiaLanzarExcepcion() {
        orden.setEstado("ENTREGADO");
        when(ordenTrabajoRepository.findById(1L)).thenReturn(Optional.of(orden));

        assertThatThrownBy(() -> ordenTrabajoService.cambiarEstado(admin, 1L, "TRABAJANDO"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("No se puede cambiar el estado de una orden ya entregada");
    }

    @Test
    void cambiarEstado_comoCliente_deberiaLanzarAccessDenied() {
        assertThatThrownBy(() -> ordenTrabajoService.cambiarEstado(cliente, 1L, "TRABAJANDO"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void eliminar_comoAdmin_deberiaEliminarOrden() {
        when(ordenTrabajoRepository.findById(1L)).thenReturn(Optional.of(orden));
        ordenTrabajoService.eliminar(admin, 1L);
        verify(ordenTrabajoRepository, times(1)).delete(orden);
    }

    @Test
    void eliminar_comoNoAdmin_deberiaLanzarAccessDenied() {
        assertThatThrownBy(() -> ordenTrabajoService.eliminar(mecanico, 1L))
                .isInstanceOf(AccessDeniedException.class);
        verify(ordenTrabajoRepository, never()).delete(any(OrdenTrabajo.class));
    }

    @Test
    void agregarRepuesto_deberiaAgregarRepuestoYActualizarStock() {
        RepuestoOrdenRequest repuestoRequest = RepuestoOrdenRequest.builder()
                .inventarioId(1L).cantidad(2).precioUnitario(new BigDecimal("25.00")).build();

        when(ordenTrabajoRepository.findById(1L)).thenReturn(Optional.of(orden));
        when(inventarioRepository.findById(1L)).thenReturn(Optional.of(repuesto));
        when(ordenTrabajoInventarioRepository.findByOrdenTrabajoAndInventario(orden, repuesto)).thenReturn(Optional.empty());
        when(ordenTrabajoInventarioRepository.save(any(OrdenTrabajoInventario.class))).thenAnswer(inv -> inv.getArgument(0));
        when(inventarioRepository.save(any(Inventario.class))).thenAnswer(inv -> inv.getArgument(0));
        when(ordenTrabajoInventarioRepository.findByOrdenTrabajo(orden)).thenReturn(List.of());
        when(ordenTrabajoRepository.save(any(OrdenTrabajo.class))).thenAnswer(inv -> inv.getArgument(0));
        when(bitacoraRepository.save(any(Bitacora.class))).thenAnswer(inv -> inv.getArgument(0));

        ordenTrabajoService.agregarRepuesto(admin, 1L, repuestoRequest);

        verify(inventarioRepository, times(1)).save(argThat(i -> i.getStockActual() == 18));
    }

    @Test
    void agregarRepuesto_stockInsuficiente_deberiaLanzarExcepcion() {
        RepuestoOrdenRequest repuestoRequest = RepuestoOrdenRequest.builder()
                .inventarioId(1L).cantidad(25).precioUnitario(new BigDecimal("25.00")).build();

        repuesto.setStockActual(20);
        when(ordenTrabajoRepository.findById(1L)).thenReturn(Optional.of(orden));
        when(inventarioRepository.findById(1L)).thenReturn(Optional.of(repuesto));

        assertThatThrownBy(() -> ordenTrabajoService.agregarRepuesto(admin, 1L, repuestoRequest))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Stock insuficiente");
    }

    @Test
    void agregarRepuesto_comoCliente_deberiaLanzarAccessDenied() {
        RepuestoOrdenRequest repuestoRequest = RepuestoOrdenRequest.builder()
                .inventarioId(1L).cantidad(2).precioUnitario(new BigDecimal("25.00")).build();

        assertThatThrownBy(() -> ordenTrabajoService.agregarRepuesto(cliente, 1L, repuestoRequest))
                .isInstanceOf(AccessDeniedException.class);
        verify(inventarioRepository, never()).save(any(Inventario.class));
    }

    @Test
    void quitarRepuesto_deberiaDevolverStockYActualizarCostos() {
        OrdenTrabajoInventario item = OrdenTrabajoInventario.builder()
                .ordenTrabajo(orden).inventario(repuesto)
                .cantidad(5).precioUnitario(new BigDecimal("25.00")).build();

        when(ordenTrabajoRepository.findById(1L)).thenReturn(Optional.of(orden));
        when(inventarioRepository.findById(1L)).thenReturn(Optional.of(repuesto));
        when(ordenTrabajoInventarioRepository.findByOrdenTrabajoAndInventario(orden, repuesto)).thenReturn(Optional.of(item));
        when(inventarioRepository.save(any(Inventario.class))).thenAnswer(inv -> inv.getArgument(0));
        when(ordenTrabajoInventarioRepository.findByOrdenTrabajo(orden)).thenReturn(List.of());
        when(ordenTrabajoRepository.save(any(OrdenTrabajo.class))).thenAnswer(inv -> inv.getArgument(0));
        when(bitacoraRepository.save(any(Bitacora.class))).thenAnswer(inv -> inv.getArgument(0));

        ordenTrabajoService.quitarRepuesto(admin, 1L, 1L);

        verify(inventarioRepository, times(1)).save(argThat(i -> i.getStockActual() == 25));
        verify(ordenTrabajoInventarioRepository, times(1)).delete(item);
    }

    @Test
    void obtenerBitacora_deberiaRetornarBitacorasOrdenadas() {
        Bitacora bitacora1 = Bitacora.builder().id(1L).ordenTrabajo(orden).accion("CREACION").build();
        Bitacora bitacora2 = Bitacora.builder().id(2L).ordenTrabajo(orden).accion("CAMBIO_ESTADO").build();

        when(ordenTrabajoRepository.findById(1L)).thenReturn(Optional.of(orden));
        when(bitacoraRepository.findByOrdenTrabajoOrderByFechaDesc(orden)).thenReturn(List.of(bitacora2, bitacora1));

        List<Bitacora> resultado = ordenTrabajoService.obtenerBitacora(1L);

        assertThat(resultado).hasSize(2);
        assertThat(resultado.get(0).getAccion()).isEqualTo("CAMBIO_ESTADO");
    }
}