package com.voltiosyruedas.taller.reservas.service;

import com.voltiosyruedas.taller.auth.entity.Rol;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.auth.repository.RolRepository;
import com.voltiosyruedas.taller.auth.repository.UsuarioRepository;
import com.voltiosyruedas.taller.reservas.dto.ReservaRequest;
import com.voltiosyruedas.taller.reservas.entity.Reserva;
import com.voltiosyruedas.taller.reservas.repository.ReservaRepository;
import com.voltiosyruedas.taller.reservas.service.ReservaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ReservaServiceIntegrationTest {

    @Autowired
    private ReservaService reservaService;

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    private Usuario cliente;
    private Rol rolCliente;

    @BeforeEach
    void setUp() {
        reservaRepository.deleteAll();
        usuarioRepository.deleteAll();
        rolCliente = rolRepository.findByNombre("CLIENTE").orElseThrow();

        cliente = Usuario.builder()
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan.perez@test.com")
                .password("password123")
                .telefono("123456789")
                .direccion("Calle Falsa 123")
                .rol(rolCliente)
                .activo(true)
                .build();
        cliente = usuarioRepository.save(cliente);
    }

    @Test
    void crear_deberiaCrearReservaConEstadoPendiente() {
        ReservaRequest request = ReservaRequest.builder()
                .fechaHora(LocalDateTime.now().plusDays(1))
                .descripcion("Cambio de aceite")
                .categoriaServicio("Mantenimiento")
                .build();

        Reserva reserva = reservaService.crear(cliente, request);

        assertThat(reserva.getId()).isNotNull();
        assertThat(reserva.getCliente().getId()).isEqualTo(cliente.getId());
        assertThat(reserva.getFechaHora()).isEqualTo(request.getFechaHora());
        assertThat(reserva.getDescripcion()).isEqualTo("Cambio de aceite");
        assertThat(reserva.getCategoriaServicio()).isEqualTo("Mantenimiento");
        assertThat(reserva.getEstado()).isEqualTo("PENDIENTE");
    }

    @Test
    void listar_deberiaRetornarPaginaDeReservas() {
        ReservaRequest request1 = ReservaRequest.builder()
                .fechaHora(LocalDateTime.now().plusDays(1))
                .descripcion("Cambio de aceite")
                .categoriaServicio("Mantenimiento")
                .build();

        ReservaRequest request2 = ReservaRequest.builder()
                .fechaHora(LocalDateTime.now().plusDays(2))
                .descripcion("Revisión frenos")
                .categoriaServicio("Seguridad")
                .build();

        reservaService.crear(cliente, request1);
        reservaService.crear(cliente, request2);

        Pageable pageable = PageRequest.of(0, 10);
        var page = reservaService.listar(pageable);

        assertThat(page.getTotalElements()).isEqualTo(2);
        assertThat(page.getContent()).hasSize(2);
    }

    @Test
    void listarPorCliente_deberiaRetornarReservasDelCliente() {
        Usuario otroCliente = Usuario.builder()
                .nombre("Maria")
                .apellido("González")
                .email("maria.gonzalez@test.com")
                .password("password123")
                .rol(rolCliente)
                .activo(true)
                .build();
        otroCliente = usuarioRepository.save(otroCliente);

        ReservaRequest request1 = ReservaRequest.builder()
                .fechaHora(LocalDateTime.now().plusDays(1))
                .descripcion("Cambio de aceite")
                .categoriaServicio("Mantenimiento")
                .build();

        ReservaRequest request2 = ReservaRequest.builder()
                .fechaHora(LocalDateTime.now().plusDays(2))
                .descripcion("Revisión frenos")
                .categoriaServicio("Seguridad")
                .build();

        reservaService.crear(cliente, request1);
        reservaService.crear(otroCliente, request2);

        List<Reserva> reservas = reservaService.listarPorCliente(cliente);

        assertThat(reservas).hasSize(1);
        assertThat(reservas.get(0).getDescripcion()).isEqualTo("Cambio de aceite");
    }

    @Test
    void actualizar_deberiaModificarReservaExistente() {
        ReservaRequest request = ReservaRequest.builder()
                .fechaHora(LocalDateTime.now().plusDays(1))
                .descripcion("Cambio de aceite")
                .categoriaServicio("Mantenimiento")
                .build();

        Reserva reserva = reservaService.crear(cliente, request);

        ReservaRequest updateRequest = ReservaRequest.builder()
                .fechaHora(LocalDateTime.now().plusDays(3))
                .descripcion("Cambio de aceite y filtro")
                .categoriaServicio("Mantenimiento")
                .build();

        Reserva actualizada = reservaService.actualizar(reserva.getId(), updateRequest);

        assertThat(actualizada.getFechaHora()).isEqualTo(updateRequest.getFechaHora());
        assertThat(actualizada.getDescripcion()).isEqualTo("Cambio de aceite y filtro");
    }

    @Test
    void cambiarEstado_deberiaModificarEstadoReserva() {
        ReservaRequest request = ReservaRequest.builder()
                .fechaHora(LocalDateTime.now().plusDays(1))
                .descripcion("Cambio de aceite")
                .categoriaServicio("Mantenimiento")
                .build();

        Reserva reserva = reservaService.crear(cliente, request);

        Reserva actualizada = reservaService.cambiarEstado(reserva.getId(), "CONFIRMADA");

        assertThat(actualizada.getEstado()).isEqualTo("CONFIRMADA");
    }

    @Test
    void cancelar_deberiaPonerEstadoCancelada() {
        ReservaRequest request = ReservaRequest.builder()
                .fechaHora(LocalDateTime.now().plusDays(1))
                .descripcion("Cambio de aceite")
                .categoriaServicio("Mantenimiento")
                .build();

        Reserva reserva = reservaService.crear(cliente, request);

        reservaService.cancelar(reserva.getId());

        Reserva cancelada = reservaService.obtenerPorId(reserva.getId());
        assertThat(cancelada.getEstado()).isEqualTo("CANCELADA");
    }

    @Test
    void eliminar_deberiaBorrarReserva() {
        ReservaRequest request = ReservaRequest.builder()
                .fechaHora(LocalDateTime.now().plusDays(1))
                .descripcion("Cambio de aceite")
                .categoriaServicio("Mantenimiento")
                .build();

        Reserva reserva = reservaService.crear(cliente, request);

        reservaService.eliminar(reserva.getId());

        assertThatThrownBy(() -> reservaService.obtenerPorId(reserva.getId()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Reserva no encontrada");
    }
}