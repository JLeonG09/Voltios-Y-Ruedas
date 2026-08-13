package com.voltiosyruedas.taller.reservas.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltiosyruedas.taller.auth.dto.UsuarioResponse;
import com.voltiosyruedas.taller.auth.entity.Rol;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.reservas.dto.ReservaRequest;
import com.voltiosyruedas.taller.reservas.dto.ReservaResponse;
import com.voltiosyruedas.taller.reservas.entity.Reserva;
import com.voltiosyruedas.taller.reservas.service.ReservaService;
import com.voltiosyruedas.taller.testutil.WithMockUsuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReservaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReservaService reservaService;

    private Usuario cliente;
    private Reserva reserva;
    private ReservaRequest request;

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

        request = ReservaRequest.builder()
                .fechaHora(LocalDateTime.now().plusDays(1))
                .descripcion("Cambio de aceite")
                .categoriaServicio("Mantenimiento")
                .build();

        reserva = Reserva.builder()
                .id(1L)
                .cliente(cliente)
                .fechaHora(request.getFechaHora())
                .descripcion(request.getDescripcion())
                .categoriaServicio(request.getCategoriaServicio())
                .estado("PENDIENTE")
                .build();

        mockToResponse();
    }

    /**
     * El controlador devuelve ReservaResponse (mapeado por reservaService.toResponse).
     * Con el servicio mockeado, hay que simular ese mapeo para que el JSON de salida
     * sea coherente con la entidad stubeada.
     */
    private void mockToResponse() {
        when(reservaService.toResponse(any(Reserva.class))).thenAnswer(invocation -> {
            Reserva r = invocation.getArgument(0);
            Usuario u = r.getCliente();
            return ReservaResponse.builder()
                    .id(r.getId())
                    .cliente(UsuarioResponse.builder()
                            .id(u != null ? u.getId() : null)
                            .nombre(u != null ? u.getNombre() : null)
                            .apellido(u != null ? u.getApellido() : null)
                            .email(u != null ? u.getEmail() : null)
                            .telefono(u != null ? u.getTelefono() : null)
                            .direccion(u != null ? u.getDireccion() : null)
                            .activo(u != null ? u.getActivo() : null)
                            .fechaCreacion(u != null ? u.getFechaCreacion() : null)
                            .fechaActualizacion(u != null ? u.getFechaActualizacion() : null)
                            .rol(u != null && u.getRol() != null ? UsuarioResponse.RolResponse.builder()
                                    .id(u.getRol().getId())
                                    .nombre(u.getRol().getNombre())
                                    .descripcion(u.getRol().getDescripcion())
                                    .build() : null)
                            .build())
                    .fechaHora(r.getFechaHora())
                    .descripcion(r.getDescripcion())
                    .categoriaServicio(r.getCategoriaServicio())
                    .estado(r.getEstado())
                    .fechaCreacion(r.getFechaCreacion())
                    .fechaActualizacion(r.getFechaActualizacion())
                    .build();
        });
    }

    @Test
    @WithMockUser(username = "admin@taller.com", roles = {"ADMIN"})
    void listar_deberiaRetornarPaginaDeReservas() throws Exception {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Reserva> page = new PageImpl<>(List.of(reserva), pageable, 1);

        when(reservaService.listar(any(), any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/reservas")
                        .with(csrf())
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(1));
    }

    @Test
    @WithMockUsuario(username = "cliente@test.com", rol = "CLIENTE")
    void misReservas_deberiaRetornarReservasDelCliente() throws Exception {
        when(reservaService.listarPorCliente(any())).thenReturn(List.of(reserva));

        mockMvc.perform(get("/api/reservas/mis-reservas")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    @WithMockUser(username = "admin@taller.com", roles = {"ADMIN"})
    void listarPorFecha_deberiaRetornarReservasEnRango() throws Exception {
        when(reservaService.listarPorFecha(any(), any())).thenReturn(List.of(reserva));

        mockMvc.perform(get("/api/reservas/fecha")
                        .with(csrf())
                        .param("inicio", "2026-01-01T00:00:00")
                        .param("fin", "2026-12-31T23:59:59"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    @WithMockUser(username = "admin@taller.com", roles = {"ADMIN"})
    void obtenerPorId_existente_deberiaRetornarReserva() throws Exception {
        when(reservaService.obtenerPorId(1L)).thenReturn(reserva);

        mockMvc.perform(get("/api/reservas/1")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.descripcion").value("Cambio de aceite"));
    }

    @Test
    @WithMockUsuario(username = "cliente@test.com", rol = "CLIENTE")
    void crear_deberiaCrearReserva() throws Exception {
        Reserva reservaCreada = Reserva.builder()
                .id(2L)
                .cliente(cliente)
                .fechaHora(request.getFechaHora())
                .descripcion(request.getDescripcion())
                .categoriaServicio(request.getCategoriaServicio())
                .estado("PENDIENTE")
                .build();

        when(reservaService.crear(any(Usuario.class), any(ReservaRequest.class))).thenReturn(reservaCreada);

        mockMvc.perform(post("/api/reservas")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.descripcion").value("Cambio de aceite"))
                .andExpect(jsonPath("$.estado").value("PENDIENTE"));
    }

    @Test
    @WithMockUser(username = "cliente@test.com", roles = {"CLIENTE"})
    void crear_datosInvalidos_deberiaRetornar400() throws Exception {
        ReservaRequest requestInvalido = ReservaRequest.builder()
                .fechaHora(null)
                .descripcion("")
                .build();

        mockMvc.perform(post("/api/reservas")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestInvalido)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.código").value("VALIDATION_ERROR"));
    }

    @Test
    @WithMockUser(username = "admin@taller.com", roles = {"ADMIN"})
    void actualizar_deberiaModificarReserva() throws Exception {
        ReservaRequest updateRequest = ReservaRequest.builder()
                .fechaHora(LocalDateTime.now().plusDays(2))
                .descripcion("Cambio de aceite y filtro")
                .categoriaServicio("Mantenimiento")
                .build();

        Reserva reservaActualizada = Reserva.builder()
                .id(1L)
                .cliente(cliente)
                .fechaHora(updateRequest.getFechaHora())
                .descripcion(updateRequest.getDescripcion())
                .categoriaServicio(updateRequest.getCategoriaServicio())
                .estado("PENDIENTE")
                .build();

        when(reservaService.actualizar(eq(1L), any())).thenReturn(reservaActualizada);

        mockMvc.perform(put("/api/reservas/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.descripcion").value("Cambio de aceite y filtro"));
    }

    @Test
    @WithMockUser(username = "admin@taller.com", roles = {"ADMIN"})
    void cambiarEstado_deberiaModificarEstado() throws Exception {
        Reserva reservaActualizada = Reserva.builder()
                .id(1L)
                .cliente(cliente)
                .fechaHora(request.getFechaHora())
                .descripcion(request.getDescripcion())
                .estado("CONFIRMADA")
                .build();

        when(reservaService.cambiarEstado(eq(1L), eq("CONFIRMADA"))).thenReturn(reservaActualizada);

        mockMvc.perform(put("/api/reservas/1/estado")
                        .with(csrf())
                        .param("estado", "CONFIRMADA"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("CONFIRMADA"));
    }

    @Test
    @WithMockUser(username = "cliente@test.com", roles = {"CLIENTE"})
    void cancelar_deberiaPonerEstadoCancelada() throws Exception {
        mockMvc.perform(put("/api/reservas/1/cancelar")
                        .with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@taller.com", roles = {"ADMIN"})
    void eliminar_deberiaRetornar204() throws Exception {
        mockMvc.perform(delete("/api/reservas/1")
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    void sinAutenticar_deberiaRetornar401() throws Exception {
        mockMvc.perform(get("/api/reservas"))
                .andExpect(status().isUnauthorized());
    }
}