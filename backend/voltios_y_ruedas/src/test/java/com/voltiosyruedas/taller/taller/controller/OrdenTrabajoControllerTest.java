package com.voltiosyruedas.taller.taller.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltiosyruedas.taller.auth.entity.Rol;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.taller.dto.OrdenTrabajoRequest;
import com.voltiosyruedas.taller.taller.dto.OrdenTrabajoResponse;
import com.voltiosyruedas.taller.taller.dto.RepuestoOrdenRequest;
import com.voltiosyruedas.taller.taller.entity.Bitacora;
import com.voltiosyruedas.taller.taller.entity.OrdenTrabajo;
import com.voltiosyruedas.taller.taller.service.OrdenTrabajoService;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OrdenTrabajoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrdenTrabajoService ordenTrabajoService;

    private Usuario cliente;
    private Usuario mecanico;
    private OrdenTrabajo orden;
    private OrdenTrabajoRequest request;

    @BeforeEach
    void setUp() {
        Rol rolCliente = new Rol(4L, "CLIENTE", "Cliente del taller");
        Rol rolMecanico = new Rol(3L, "MECANICO", "Mecánico del taller");

        cliente = Usuario.builder()
                .id(1L)
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan.perez@test.com")
                .password("encodedPassword")
                .rol(rolCliente)
                .activo(true)
                .build();

        mecanico = Usuario.builder()
                .id(2L)
                .nombre("Carlos")
                .apellido("Mecánico")
                .email("carlos.mecanico@test.com")
                .password("encodedPassword")
                .rol(rolMecanico)
                .activo(true)
                .build();

        request = OrdenTrabajoRequest.builder()
                .numeroOrden("OT-001")
                .clienteId(1L)
                .mecanicoId(2L)
                .descripcionProblema("Ruido en motor")
                .build();

        orden = OrdenTrabajo.builder()
                .id(1L)
                .numeroOrden("OT-001")
                .cliente(cliente)
                .mecanico(mecanico)
                .descripcionProblema(request.getDescripcionProblema())
                .estado("RECIEN_INGRESADO")
                .build();

        mockMapearRespuesta();
        mockMapBitacora();
    }

    /**
     * El controlador devuelve OrdenTrabajoResponse (mapeado por
     * ordenTrabajoService.mapearRespuesta). Con el servicio mockeado hay que
     * simular ese mapeo para que el JSON de salida sea coherente con la entidad.
     */
    private void mockMapearRespuesta() {
        when(ordenTrabajoService.mapearRespuesta(any(OrdenTrabajo.class), anyBoolean())).thenAnswer(invocation -> {
            OrdenTrabajo o = invocation.getArgument(0);
            return OrdenTrabajoResponse.builder()
                    .id(o.getId())
                    .numeroOrden(o.getNumeroOrden())
                    .descripcionProblema(o.getDescripcionProblema())
                    .diagnostico(o.getDiagnostico())
                    .solucionAplicada(o.getSolucionAplicada())
                    .estado(o.getEstado())
                    .costoTotal(o.getCostoTotal())
                    .build();
        });
    }

    private void mockMapBitacora() {
        when(ordenTrabajoService.mapBitacora(any(Bitacora.class))).thenAnswer(invocation -> {
            Bitacora b = invocation.getArgument(0);
            return com.voltiosyruedas.taller.taller.dto.BitacoraResponse.builder()
                    .id(b.getId())
                    .accion(b.getAccion())
                    .descripcion(b.getDescripcion())
                    .estadoAnterior(b.getEstadoAnterior())
                    .estadoNuevo(b.getEstadoNuevo())
                    .build();
        });
    }

    @Test
    @WithMockUser(username = "admin@taller.com", roles = {"ADMIN"})
    void listar_deberiaRetornarPaginaDeOrdenes() throws Exception {
        Pageable pageable = PageRequest.of(0, 10);
        Page<OrdenTrabajo> page = new PageImpl<>(List.of(orden), pageable, 1);

        when(ordenTrabajoService.listar(any())).thenReturn(page);

        mockMvc.perform(get("/api/ordenes")
                        .with(csrf())
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(1));
    }

    @Test
    @WithMockUsuario(username = "cliente@test.com", rol = "CLIENTE")
    void misOrdenes_deberiaRetornarOrdenesDelCliente() throws Exception {
        when(ordenTrabajoService.listarPorCliente(any())).thenReturn(List.of(orden));

        mockMvc.perform(get("/api/ordenes/mis-ordenes")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    @WithMockUser(username = "admin@taller.com", roles = {"ADMIN"})
    void ordenesPorMecanico_deberiaRetornarOrdenesDelMecanico() throws Exception {
        when(ordenTrabajoService.listarPorMecanico(any())).thenReturn(List.of(orden));

        mockMvc.perform(get("/api/ordenes/mecanico/2")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    @WithMockUser(username = "admin@taller.com", roles = {"ADMIN"})
    void ordenesPorEstado_deberiaRetornarOrdenesConEseEstado() throws Exception {
        when(ordenTrabajoService.listarPorEstado("RECIEN_INGRESADO")).thenReturn(List.of(orden));

        mockMvc.perform(get("/api/ordenes/estado/RECIEN_INGRESADO")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].estado").value("RECIEN_INGRESADO"));
    }

    @Test
    @WithMockUsuario(username = "admin@taller.com", rol = "ADMIN")
    void obtenerPorId_existente_deberiaRetornarOrden() throws Exception {
        when(ordenTrabajoService.obtenerPorId(1L)).thenReturn(orden);

        mockMvc.perform(get("/api/ordenes/1")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.numeroOrden").value("OT-001"))
                .andExpect(jsonPath("$.estado").value("RECIEN_INGRESADO"));
    }

    @Test
    @WithMockUsuario(username = "admin@taller.com", rol = "ADMIN")
    void obtenerPorNumeroOrden_existente_deberiaRetornarOrden() throws Exception {
        when(ordenTrabajoService.obtenerPorNumeroOrden("OT-001")).thenReturn(orden);

        mockMvc.perform(get("/api/ordenes/numero/OT-001")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.numeroOrden").value("OT-001"));
    }

    @Test
    @WithMockUsuario(username = "admin@taller.com", rol = "ADMIN")
    void crear_deberiaCrearOrden() throws Exception {
        OrdenTrabajo ordenCreada = OrdenTrabajo.builder()
                .id(2L)
                .numeroOrden("OT-002")
                .cliente(cliente)
                .mecanico(mecanico)
                .descripcionProblema(request.getDescripcionProblema())
                .estado("RECIEN_INGRESADO")
                .build();

        when(ordenTrabajoService.crear(any(Usuario.class), any(OrdenTrabajoRequest.class))).thenReturn(ordenCreada);

        mockMvc.perform(post("/api/ordenes")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.numeroOrden").value("OT-002"))
                .andExpect(jsonPath("$.estado").value("RECIEN_INGRESADO"));
    }

    @Test
    @WithMockUser(username = "admin@taller.com", roles = {"ADMIN"})
    void crear_datosInvalidos_deberiaRetornar400() throws Exception {
        OrdenTrabajoRequest requestInvalido = OrdenTrabajoRequest.builder()
                .numeroOrden("")
                .clienteId(null)
                .descripcionProblema("")
                .build();

        mockMvc.perform(post("/api/ordenes")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestInvalido)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.código").value("VALIDATION_ERROR"));
    }

    @Test
    @WithMockUsuario(username = "admin@taller.com", rol = "ADMIN")
    void actualizar_deberiaModificarOrden() throws Exception {
        OrdenTrabajoRequest updateRequest = OrdenTrabajoRequest.builder()
                .numeroOrden("OT-001")
                .clienteId(1L)
                .mecanicoId(2L)
                .descripcionProblema("Ruido en motor y transmisión")
                .diagnostico("Filtro sucio")
                .estado("TRABAJANDO")
                .costoManoObra(new BigDecimal("75.00"))
                .costoRepuestos(new BigDecimal("25.00"))
                .build();

        OrdenTrabajo ordenActualizada = OrdenTrabajo.builder()
                .id(1L)
                .numeroOrden("OT-001")
                .cliente(cliente)
                .mecanico(mecanico)
                .descripcionProblema("Ruido en motor y transmisión")
                .diagnostico("Filtro sucio")
                .estado("TRABAJANDO")
                .costoManoObra(new BigDecimal("75.00"))
                .costoRepuestos(new BigDecimal("25.00"))
                .costoTotal(new BigDecimal("100.00"))
                .build();

        when(ordenTrabajoService.actualizar(any(Usuario.class), eq(1L), any(OrdenTrabajoRequest.class))).thenReturn(ordenActualizada);

        mockMvc.perform(put("/api/ordenes/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.descripcionProblema").value("Ruido en motor y transmisión"))
                .andExpect(jsonPath("$.estado").value("TRABAJANDO"))
                .andExpect(jsonPath("$.costoTotal").value(100.00));
    }

    @Test
    @WithMockUsuario(username = "admin@taller.com", rol = "ADMIN")
    void cambiarEstado_deberiaModificarEstado() throws Exception {
        OrdenTrabajo ordenActualizada = OrdenTrabajo.builder()
                .id(1L)
                .numeroOrden("OT-001")
                .cliente(cliente)
                .mecanico(mecanico)
                .descripcionProblema("Ruido en motor")
                .estado("TRABAJANDO")
                .build();

        when(ordenTrabajoService.cambiarEstado(any(Usuario.class), eq(1L), eq("TRABAJANDO"))).thenReturn(ordenActualizada);

        mockMvc.perform(put("/api/ordenes/1/estado")
                        .with(csrf())
                        .param("estado", "TRABAJANDO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("TRABAJANDO"));
    }

    @Test
    @WithMockUsuario(username = "admin@taller.com", rol = "ADMIN")
    void agregarRepuesto_deberiaAgregarRepuesto() throws Exception {
        RepuestoOrdenRequest repuestoRequest = RepuestoOrdenRequest.builder()
                .inventarioId(1L)
                .cantidad(2)
                .precioUnitario(new BigDecimal("25.00"))
                .build();

        mockMvc.perform(post("/api/ordenes/1/repuestos")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(repuestoRequest)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUsuario(username = "admin@taller.com", rol = "ADMIN")
    void quitarRepuesto_deberiaRetornar204() throws Exception {
        mockMvc.perform(delete("/api/ordenes/1/repuestos/1")
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUsuario(username = "admin@taller.com", rol = "ADMIN")
    void obtenerBitacora_deberiaRetornarLista() throws Exception {
        Bitacora bitacora = Bitacora.builder()
                .id(1L)
                .accion("CAMBIO_ESTADO")
                .descripcion("Cambio de RECIEN_INGRESADO a TRABAJANDO")
                .estadoAnterior("RECIEN_INGRESADO")
                .estadoNuevo("TRABAJANDO")
                .build();

        when(ordenTrabajoService.obtenerPorId(1L)).thenReturn(orden);
        when(ordenTrabajoService.obtenerBitacora(1L)).thenReturn(List.of(bitacora));

        mockMvc.perform(get("/api/ordenes/1/bitacora")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].accion").value("CAMBIO_ESTADO"))
                .andExpect(jsonPath("$[0].estadoAnterior").value("RECIEN_INGRESADO"));
    }

    @Test
    void sinAutenticar_deberiaRetornar401() throws Exception {
        mockMvc.perform(get("/api/ordenes"))
                .andExpect(status().isUnauthorized());
    }
}