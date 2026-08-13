package com.voltiosyruedas.taller.reservas.service;

import com.voltiosyruedas.taller.auth.entity.Rol;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.notificaciones.service.MailService;
import com.voltiosyruedas.taller.reservas.dto.ReservaRequest;
import com.voltiosyruedas.taller.reservas.entity.Reserva;
import com.voltiosyruedas.taller.reservas.repository.ReservaRepository;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservaServiceTest {

    @Mock
    private ReservaRepository reservaRepository;

    @Mock
    private MailService mailService;

    @InjectMocks
    private ReservaService reservaService;

    private Usuario cliente;
    private ReservaRequest reservaRequest;
    private Reserva reserva;

    @BeforeEach
    void setUp() {
        Rol rolCliente = new Rol(4L, "CLIENTE", "Cliente del taller");

        cliente = Usuario.builder()
                .id(1L)
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan.perez@test.com")
                .password("encodedPassword")
                .rol(rolCliente)
                .activo(true)
                .build();

        reservaRequest = ReservaRequest.builder()
                .fechaHora(LocalDateTime.now().plusDays(1))
                .descripcion("Cambio de aceite")
                .categoriaServicio("Mantenimiento")
                .build();

        reserva = Reserva.builder()
                .id(1L)
                .cliente(cliente)
                .fechaHora(reservaRequest.getFechaHora())
                .descripcion(reservaRequest.getDescripcion())
                .categoriaServicio(reservaRequest.getCategoriaServicio())
                .estado("PENDIENTE")
                .build();
    }

    @Test
    void crear_deberiaCrearReservaConEstadoPendiente() {
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(invocation -> {
            Reserva r = invocation.getArgument(0);
            r.setId(1L);
            return r;
        });

        Reserva resultado = reservaService.crear(cliente, reservaRequest);

        assertThat(resultado).isNotNull();
        assertThat(resultado.getId()).isEqualTo(1L);
        assertThat(resultado.getCliente()).isEqualTo(cliente);
        assertThat(resultado.getFechaHora()).isEqualTo(reservaRequest.getFechaHora());
        assertThat(resultado.getDescripcion()).isEqualTo("Cambio de aceite");
        assertThat(resultado.getCategoriaServicio()).isEqualTo("Mantenimiento");
        assertThat(resultado.getEstado()).isEqualTo("PENDIENTE");

        verify(reservaRepository, times(1)).save(any(Reserva.class));
    }

    @Test
    void listar_deberiaRetornarPaginaDeReservas() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Reserva> page = new PageImpl<>(List.of(reserva, reserva), pageable, 2);

        when(reservaRepository.findAll(pageable)).thenReturn(page);

        Page<Reserva> resultado = reservaService.listar(pageable, null, null);

        assertThat(resultado).isNotNull();
        assertThat(resultado.getTotalElements()).isEqualTo(2);
        assertThat(resultado.getContent()).hasSize(2);

        verify(reservaRepository, times(1)).findAll(pageable);
    }

    @Test
    void listarPorCliente_deberiaRetornarReservasDelCliente() {
        when(reservaRepository.findByCliente(cliente)).thenReturn(List.of(reserva, reserva));

        List<Reserva> resultado = reservaService.listarPorCliente(cliente);

        assertThat(resultado).hasSize(2);
        verify(reservaRepository, times(1)).findByCliente(cliente);
    }

    @Test
    void listarPorFecha_deberiaRetornarReservasEnRango() {
        LocalDateTime inicio = LocalDateTime.now().minusDays(1);
        LocalDateTime fin = LocalDateTime.now().plusDays(1);

        when(reservaRepository.findByFechaHoraBetween(inicio, fin)).thenReturn(List.of(reserva));

        List<Reserva> resultado = reservaService.listarPorFecha(inicio, fin);

        assertThat(resultado).hasSize(1);
        verify(reservaRepository, times(1)).findByFechaHoraBetween(inicio, fin);
    }

    @Test
    void obtenerPorId_existente_deberiaRetornarReserva() {
        when(reservaRepository.findById(1L)).thenReturn(Optional.of(reserva));

        Reserva resultado = reservaService.obtenerPorId(1L);

        assertThat(resultado).isNotNull();
        assertThat(resultado.getId()).isEqualTo(1L);
        verify(reservaRepository, times(1)).findById(1L);
    }

    @Test
    void obtenerPorId_inexistente_deberiaLanzarExcepcion() {
        when(reservaRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reservaService.obtenerPorId(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Reserva no encontrada con ID: 999");

        verify(reservaRepository, times(1)).findById(999L);
    }

    @Test
    void actualizar_deberiaModificarReservaExistente() {
        ReservaRequest updateRequest = ReservaRequest.builder()
                .fechaHora(LocalDateTime.now().plusDays(2))
                .descripcion("Cambio de aceite y filtro")
                .categoriaServicio("Mantenimiento")
                .build();

        when(reservaRepository.findById(1L)).thenReturn(Optional.of(reserva));
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Reserva resultado = reservaService.actualizar(1L, updateRequest);

        assertThat(resultado.getFechaHora()).isEqualTo(updateRequest.getFechaHora());
        assertThat(resultado.getDescripcion()).isEqualTo("Cambio de aceite y filtro");
        assertThat(resultado.getCategoriaServicio()).isEqualTo("Mantenimiento");

        verify(reservaRepository, times(1)).findById(1L);
        verify(reservaRepository, times(1)).save(any(Reserva.class));
    }

    @Test
    void cambiarEstado_deberiaModificarEstadoReserva() {
        when(reservaRepository.findById(1L)).thenReturn(Optional.of(reserva));
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Reserva resultado = reservaService.cambiarEstado(1L, "CONFIRMADA");

        assertThat(resultado.getEstado()).isEqualTo("CONFIRMADA");
        verify(reservaRepository, times(1)).findById(1L);
        verify(reservaRepository, times(1)).save(any(Reserva.class));
    }

    @Test
    void cancelar_deberiaPonerEstadoCancelada() {
        when(reservaRepository.findById(1L)).thenReturn(Optional.of(reserva));
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reservaService.cancelar(1L);

        verify(reservaRepository, times(1)).findById(1L);
        verify(reservaRepository, times(1)).save(argThat(r -> "CANCELADA".equals(r.getEstado())));
    }

    @Test
    void eliminar_deberiaEliminarReserva() {
        reservaService.eliminar(1L);

        verify(reservaRepository, times(1)).deleteById(1L);
    }
}