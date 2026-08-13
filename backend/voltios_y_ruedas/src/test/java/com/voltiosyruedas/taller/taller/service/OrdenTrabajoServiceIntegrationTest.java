package com.voltiosyruedas.taller.taller.service;

import com.voltiosyruedas.taller.auth.entity.Rol;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.auth.repository.RolRepository;
import com.voltiosyruedas.taller.auth.repository.UsuarioRepository;
import com.voltiosyruedas.taller.inventario.entity.Inventario;
import com.voltiosyruedas.taller.inventario.repository.InventarioRepository;
import com.voltiosyruedas.taller.reservas.entity.Reserva;
import com.voltiosyruedas.taller.reservas.repository.ReservaRepository;
import com.voltiosyruedas.taller.taller.dto.OrdenTrabajoRequest;
import com.voltiosyruedas.taller.taller.dto.RepuestoOrdenRequest;
import com.voltiosyruedas.taller.taller.entity.Bitacora;
import com.voltiosyruedas.taller.taller.entity.OrdenTrabajo;
import com.voltiosyruedas.taller.taller.repository.BitacoraRepository;
import com.voltiosyruedas.taller.taller.repository.OrdenTrabajoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class OrdenTrabajoServiceIntegrationTest {

    @Autowired
    private OrdenTrabajoService ordenTrabajoService;

    @Autowired
    private OrdenTrabajoRepository ordenTrabajoRepository;

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private InventarioRepository inventarioRepository;

    @Autowired
    private BitacoraRepository bitacoraRepository;

    private Usuario cliente;
    private Usuario mecanico;
    private Usuario jefeTaller;
    private Rol rolCliente;
    private Rol rolMecanico;
    private Rol rolJefeTaller;
    private Inventario repuesto;
    private Reserva reserva;

    @BeforeEach
    void setUp() {
        bitacoraRepository.deleteAll();
        ordenTrabajoRepository.deleteAll();
        reservaRepository.deleteAll();
        inventarioRepository.deleteAll();
        usuarioRepository.deleteAll();

        rolCliente = rolRepository.findByNombre("CLIENTE").orElseThrow();
        rolMecanico = rolRepository.findByNombre("MECANICO").orElseThrow();
        rolJefeTaller = rolRepository.findByNombre("JEFE_TALLER").orElseThrow();

        cliente = Usuario.builder()
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan.perez@test.com")
                .password("password123")
                .telefono("88888888")
                .direccion("Calle Falsa 123")
                .rol(rolCliente)
                .activo(true)
                .build();
        cliente = usuarioRepository.save(cliente);

        mecanico = Usuario.builder()
                .nombre("Carlos")
                .apellido("Mecánico")
                .email("carlos.mecanico@test.com")
                .password("password123")
                .rol(rolMecanico)
                .activo(true)
                .build();
        mecanico = usuarioRepository.save(mecanico);

        jefeTaller = Usuario.builder()
                .nombre("Ana")
                .apellido("Jefa")
                .email("ana.jefa@test.com")
                .password("password123")
                .rol(rolJefeTaller)
                .activo(true)
                .build();
        jefeTaller = usuarioRepository.save(jefeTaller);

        repuesto = Inventario.builder()
                .codigo("REP-001")
                .nombre("Filtro de aceite")
                .categoria("Filtros")
                .stockActual(20)
                .stockMinimo(5)
                .precioCompra(new BigDecimal("15.00"))
                .precioVenta(new BigDecimal("25.00"))
                .activo(true)
                .build();
        repuesto = inventarioRepository.save(repuesto);

        reserva = Reserva.builder()
                .cliente(cliente)
                .fechaHora(LocalDateTime.now().plusDays(1))
                .descripcion("Cambio de aceite")
                .categoriaServicio("Mantenimiento")
                .estado("PENDIENTE")
                .build();
        reserva = reservaRepository.save(reserva);
    }

    @Test
    void crear_deberiaCrearOrdenConEstadoRecienIngresado() {
        OrdenTrabajoRequest request = OrdenTrabajoRequest.builder()
                .numeroOrden("OT-001")
                .clienteId(cliente.getId())
                .mecanicoId(mecanico.getId())
                .reservaId(reserva.getId())
                .descripcionProblema("Ruido en motor")
                .diagnostico("Filtro sucio")
                .solucionAplicada("Cambio de filtro")
                .fechaEstimadaEntrega(LocalDateTime.now().plusDays(2))
                .costoManoObra(new BigDecimal("50.00"))
                .costoRepuestos(BigDecimal.ZERO)
                .build();

        OrdenTrabajo orden = ordenTrabajoService.crear(jefeTaller, request);

        assertThat(orden.getId()).isNotNull();
        assertThat(orden.getNumeroOrden()).isEqualTo("OT-001");
        assertThat(orden.getCliente().getId()).isEqualTo(cliente.getId());
        assertThat(orden.getMecanico().getId()).isEqualTo(mecanico.getId());
        assertThat(orden.getReserva().getId()).isEqualTo(reserva.getId());
        assertThat(orden.getEstado()).isEqualTo("RECIEN_INGRESADO");
        assertThat(orden.getCostoManoObra()).isEqualTo(new BigDecimal("50.00"));
        assertThat(orden.getCostoTotal()).isEqualTo(new BigDecimal("50.00"));
    }

    @Test
    void crear_deberiaLanzarExcepcionSiNumeroOrdenDuplicado() {
        OrdenTrabajoRequest request = OrdenTrabajoRequest.builder()
                .numeroOrden("OT-001")
                .clienteId(cliente.getId())
                .descripcionProblema("Ruido en motor")
                .build();

        ordenTrabajoService.crear(jefeTaller, request);

        assertThatThrownBy(() -> ordenTrabajoService.crear(jefeTaller, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Ya existe una orden con ese numero");
    }

    @Test
    void listar_deberiaRetornarPaginaDeOrdenes() {
        OrdenTrabajoRequest request1 = OrdenTrabajoRequest.builder()
                .numeroOrden("OT-001")
                .clienteId(cliente.getId())
                .descripcionProblema("Ruido en motor")
                .build();

        OrdenTrabajoRequest request2 = OrdenTrabajoRequest.builder()
                .numeroOrden("OT-002")
                .clienteId(cliente.getId())
                .descripcionProblema("Freno chirria")
                .build();

        ordenTrabajoService.crear(jefeTaller, request1);
        ordenTrabajoService.crear(jefeTaller, request2);

        Pageable pageable = PageRequest.of(0, 10);
        var page = ordenTrabajoService.listar(pageable);

        assertThat(page.getTotalElements()).isEqualTo(2);
        assertThat(page.getContent()).hasSize(2);
    }

    @Test
    void listarPorCliente_deberiaRetornarOrdenesDelCliente() {
        Usuario otroCliente = Usuario.builder()
                .nombre("Maria")
                .apellido("González")
                .email("maria.gonzalez@test.com")
                .password("password123")
                .rol(rolCliente)
                .activo(true)
                .build();
        otroCliente = usuarioRepository.save(otroCliente);

        OrdenTrabajoRequest request1 = OrdenTrabajoRequest.builder()
                .numeroOrden("OT-001")
                .clienteId(cliente.getId())
                .descripcionProblema("Ruido en motor")
                .build();

        OrdenTrabajoRequest request2 = OrdenTrabajoRequest.builder()
                .numeroOrden("OT-002")
                .clienteId(otroCliente.getId())
                .descripcionProblema("Freno chirria")
                .build();

        ordenTrabajoService.crear(jefeTaller, request1);
        ordenTrabajoService.crear(jefeTaller, request2);

        List<OrdenTrabajo> ordenes = ordenTrabajoService.listarPorCliente(cliente);

        assertThat(ordenes).hasSize(1);
        assertThat(ordenes.get(0).getNumeroOrden()).isEqualTo("OT-001");
    }

    @Test
    void listarPorMecanico_deberiaRetornarOrdenesDelMecanico() {
        Usuario otroMecanico = Usuario.builder()
                .nombre("Pedro")
                .apellido("Mecánico")
                .email("pedro.mecanico@test.com")
                .password("password123")
                .rol(rolMecanico)
                .activo(true)
                .build();
        otroMecanico = usuarioRepository.save(otroMecanico);

        OrdenTrabajoRequest request1 = OrdenTrabajoRequest.builder()
                .numeroOrden("OT-001")
                .clienteId(cliente.getId())
                .mecanicoId(mecanico.getId())
                .descripcionProblema("Ruido en motor")
                .build();

        OrdenTrabajoRequest request2 = OrdenTrabajoRequest.builder()
                .numeroOrden("OT-002")
                .clienteId(cliente.getId())
                .mecanicoId(otroMecanico.getId())
                .descripcionProblema("Freno chirria")
                .build();

        ordenTrabajoService.crear(jefeTaller, request1);
        ordenTrabajoService.crear(jefeTaller, request2);

        List<OrdenTrabajo> ordenes = ordenTrabajoService.listarPorMecanico(mecanico);

        assertThat(ordenes).hasSize(1);
        assertThat(ordenes.get(0).getNumeroOrden()).isEqualTo("OT-001");
    }

    @Test
    void listarPorEstado_deberiaRetornarOrdenesConEseEstado() {
        OrdenTrabajoRequest request1 = OrdenTrabajoRequest.builder()
                .numeroOrden("OT-001")
                .clienteId(cliente.getId())
                .descripcionProblema("Ruido en motor")
                .estado("RECIEN_INGRESADO")
                .build();

        OrdenTrabajoRequest request2 = OrdenTrabajoRequest.builder()
                .numeroOrden("OT-002")
                .clienteId(cliente.getId())
                .descripcionProblema("Freno chirria")
                .estado("TRABAJANDO")
                .build();

        ordenTrabajoService.crear(jefeTaller, request1);
        ordenTrabajoService.crear(jefeTaller, request2);

        List<OrdenTrabajo> ordenes = ordenTrabajoService.listarPorEstado("RECIEN_INGRESADO");

        assertThat(ordenes).hasSize(1);
        assertThat(ordenes.get(0).getNumeroOrden()).isEqualTo("OT-001");
    }

    @Test
    void cambiarEstado_deberiaTransicionarCorrectamente() {
        OrdenTrabajoRequest request = OrdenTrabajoRequest.builder()
                .numeroOrden("OT-001")
                .clienteId(cliente.getId())
                .mecanicoId(mecanico.getId())
                .descripcionProblema("Ruido en motor")
                .build();

        OrdenTrabajo orden = ordenTrabajoService.crear(jefeTaller, request);

        OrdenTrabajo actualizada = ordenTrabajoService.cambiarEstado(jefeTaller, orden.getId(), "TRABAJANDO");

        assertThat(actualizada.getEstado()).isEqualTo("TRABAJANDO");
    }

    @Test
    void cambiarEstado_deberiaRegistrarEnBitacora() {
        OrdenTrabajoRequest request = OrdenTrabajoRequest.builder()
                .numeroOrden("OT-001")
                .clienteId(cliente.getId())
                .mecanicoId(mecanico.getId())
                .descripcionProblema("Ruido en motor")
                .build();

        OrdenTrabajo orden = ordenTrabajoService.crear(jefeTaller, request);

        ordenTrabajoService.cambiarEstado(jefeTaller, orden.getId(), "TRABAJANDO");

        List<Bitacora> bitacoras = ordenTrabajoService.obtenerBitacora(orden.getId());

        assertThat(bitacoras).hasSize(2);
        Bitacora cambio = bitacoras.stream()
                .filter(b -> "CAMBIO_ESTADO".equals(b.getAccion()))
                .findFirst().orElseThrow();
        assertThat(cambio.getEstadoAnterior()).isEqualTo("RECIEN_INGRESADO");
        assertThat(cambio.getEstadoNuevo()).isEqualTo("TRABAJANDO");
    }

    @Test
    void cambiarEstado_aEntregado_deberiaPonerFechaEntregaReal() {
        OrdenTrabajoRequest request = OrdenTrabajoRequest.builder()
                .numeroOrden("OT-001")
                .clienteId(cliente.getId())
                .mecanicoId(mecanico.getId())
                .descripcionProblema("Ruido en motor")
                .build();

        OrdenTrabajo orden = ordenTrabajoService.crear(jefeTaller, request);

        ordenTrabajoService.cambiarEstado(jefeTaller, orden.getId(), "TRABAJANDO");
        OrdenTrabajo entregada = ordenTrabajoService.cambiarEstado(jefeTaller, orden.getId(), "ENTREGADO");

        assertThat(entregada.getEstado()).isEqualTo("ENTREGADO");
        assertThat(entregada.getFechaEntregaReal()).isNotNull();
    }

    @Test
    void cambiarEstado_deberiaRechazarTransicionInvalida() {
        OrdenTrabajoRequest request = OrdenTrabajoRequest.builder()
                .numeroOrden("OT-001")
                .clienteId(cliente.getId())
                .mecanicoId(mecanico.getId())
                .descripcionProblema("Ruido en motor")
                .build();

        OrdenTrabajo orden = ordenTrabajoService.crear(jefeTaller, request);
        ordenTrabajoService.cambiarEstado(jefeTaller, orden.getId(), "ENTREGADO");

        assertThatThrownBy(() -> ordenTrabajoService.cambiarEstado(jefeTaller, orden.getId(), "TRABAJANDO"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("No se puede cambiar el estado de una orden ya entregada");
    }

    @Test
    void agregarRepuesto_deberiaAgregarRepuestoYActualizarStockYCostos() {
        OrdenTrabajoRequest request = OrdenTrabajoRequest.builder()
                .numeroOrden("OT-001")
                .clienteId(cliente.getId())
                .mecanicoId(mecanico.getId())
                .descripcionProblema("Ruido en motor")
                .build();

        OrdenTrabajo orden = ordenTrabajoService.crear(jefeTaller, request);

        RepuestoOrdenRequest repuestoRequest = RepuestoOrdenRequest.builder()
                .inventarioId(repuesto.getId())
                .cantidad(2)
                .precioUnitario(new BigDecimal("25.00"))
                .build();

        ordenTrabajoService.agregarRepuesto(jefeTaller, orden.getId(), repuestoRequest);

        OrdenTrabajo actualizada = ordenTrabajoService.obtenerPorId(orden.getId());
        Inventario inventarioActualizado = inventarioRepository.findById(repuesto.getId()).orElseThrow();

        assertThat(actualizada.getRepuestosUtilizados()).hasSize(1);
        assertThat(actualizada.getCostoRepuestos()).isEqualTo(new BigDecimal("50.00"));
        assertThat(actualizada.getCostoTotal()).isEqualTo(new BigDecimal("50.00"));
        assertThat(inventarioActualizado.getStockActual()).isEqualTo(18);
    }

    @Test
    void agregarRepuesto_deberiaIncrementarCantidadSiYaExiste() {
        OrdenTrabajoRequest request = OrdenTrabajoRequest.builder()
                .numeroOrden("OT-001")
                .clienteId(cliente.getId())
                .descripcionProblema("Ruido en motor")
                .build();

        OrdenTrabajo orden = ordenTrabajoService.crear(jefeTaller, request);

        RepuestoOrdenRequest repuestoRequest1 = RepuestoOrdenRequest.builder()
                .inventarioId(repuesto.getId())
                .cantidad(2)
                .precioUnitario(new BigDecimal("25.00"))
                .build();

        RepuestoOrdenRequest repuestoRequest2 = RepuestoOrdenRequest.builder()
                .inventarioId(repuesto.getId())
                .cantidad(3)
                .precioUnitario(new BigDecimal("25.00"))
                .build();

        ordenTrabajoService.agregarRepuesto(jefeTaller, orden.getId(), repuestoRequest1);
        ordenTrabajoService.agregarRepuesto(jefeTaller, orden.getId(), repuestoRequest2);

        OrdenTrabajo actualizada = ordenTrabajoService.obtenerPorId(orden.getId());
        Inventario inventarioActualizado = inventarioRepository.findById(repuesto.getId()).orElseThrow();

        assertThat(actualizada.getRepuestosUtilizados()).hasSize(1);
        assertThat(actualizada.getRepuestosUtilizados().get(0).getCantidad()).isEqualTo(5);
        assertThat(actualizada.getCostoRepuestos()).isEqualTo(new BigDecimal("125.00"));
        assertThat(inventarioActualizado.getStockActual()).isEqualTo(15);
    }

    @Test
    void agregarRepuesto_deberiaLanzarExcepcionSiStockInsuficiente() {
        OrdenTrabajoRequest request = OrdenTrabajoRequest.builder()
                .numeroOrden("OT-001")
                .clienteId(cliente.getId())
                .descripcionProblema("Ruido en motor")
                .build();

        OrdenTrabajo orden = ordenTrabajoService.crear(jefeTaller, request);

        RepuestoOrdenRequest repuestoRequest = RepuestoOrdenRequest.builder()
                .inventarioId(repuesto.getId())
                .cantidad(25)
                .precioUnitario(new BigDecimal("25.00"))
                .build();

        assertThatThrownBy(() -> ordenTrabajoService.agregarRepuesto(jefeTaller, orden.getId(), repuestoRequest))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Stock insuficiente");
    }

    @Test
    void quitarRepuesto_deberiaDevolverStockYActualizarCostos() {
        OrdenTrabajoRequest request = OrdenTrabajoRequest.builder()
                .numeroOrden("OT-001")
                .clienteId(cliente.getId())
                .descripcionProblema("Ruido en motor")
                .build();

        OrdenTrabajo orden = ordenTrabajoService.crear(jefeTaller, request);

        RepuestoOrdenRequest repuestoRequest = RepuestoOrdenRequest.builder()
                .inventarioId(repuesto.getId())
                .cantidad(5)
                .precioUnitario(new BigDecimal("25.00"))
                .build();

        ordenTrabajoService.agregarRepuesto(jefeTaller, orden.getId(), repuestoRequest);
        ordenTrabajoService.quitarRepuesto(jefeTaller, orden.getId(), repuesto.getId());

        OrdenTrabajo actualizada = ordenTrabajoService.obtenerPorId(orden.getId());
        Inventario inventarioActualizado = inventarioRepository.findById(repuesto.getId()).orElseThrow();

        assertThat(actualizada.getRepuestosUtilizados()).isEmpty();
        assertThat(actualizada.getCostoRepuestos()).isEqualTo(BigDecimal.ZERO);
        assertThat(actualizada.getCostoTotal()).isEqualTo(BigDecimal.ZERO);
        assertThat(inventarioActualizado.getStockActual()).isEqualTo(20);
    }
}