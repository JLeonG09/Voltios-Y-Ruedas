package com.voltiosyruedas.taller.inventario.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltiosyruedas.taller.inventario.dto.InventarioRequest;
import com.voltiosyruedas.taller.inventario.entity.Inventario;
import com.voltiosyruedas.taller.inventario.service.InventarioService;
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
class InventarioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private InventarioService inventarioService;

    private Inventario inventario;
    private InventarioRequest request;

    @BeforeEach
    void setUp() {
        inventario = Inventario.builder()
                .id(1L)
                .codigo("REP-001")
                .nombre("Filtro de aceite")
                .categoria("Filtros")
                .stockActual(10)
                .stockMinimo(5)
                .precioCompra(new BigDecimal("15.00"))
                .precioVenta(new BigDecimal("25.00"))
                .activo(true)
                .build();

        request = InventarioRequest.builder()
                .codigo("REP-001")
                .nombre("Filtro de aceite")
                .categoria("Filtros")
                .stockActual(10)
                .stockMinimo(5)
                .precioCompra(new BigDecimal("15.00"))
                .precioVenta(new BigDecimal("25.00"))
                .activo(true)
                .build();
    }

    @Test
    @WithMockUser(username = "admin@taller.com", roles = {"ADMIN"})
    void listar_deberiaRetornarPaginaDeInventario() throws Exception {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Inventario> page = new PageImpl<>(List.of(inventario), pageable, 1);

        when(inventarioService.listar(any())).thenReturn(page);

        mockMvc.perform(get("/api/inventario")
                        .with(csrf())
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(1));
    }

    @Test
    @WithMockUser(username = "mecanico@test.com", roles = {"MECANICO"})
    void listarActivos_deberiaRetornarSoloActivos() throws Exception {
        when(inventarioService.listarActivos()).thenReturn(List.of(inventario));

        mockMvc.perform(get("/api/inventario/activos")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].activo").value(true));
    }

    @Test
    @WithMockUser(username = "admin@taller.com", roles = {"ADMIN"})
    void listarPorCategoria_deberiaRetornarInventarioDeCategoria() throws Exception {
        when(inventarioService.listarPorCategoria("Filtros")).thenReturn(List.of(inventario));

        mockMvc.perform(get("/api/inventario/categoria/Filtros")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].categoria").value("Filtros"));
    }

    @Test
    @WithMockUser(username = "jefe@test.com", roles = {"JEFE_TALLER"})
    void listarStockBajo_deberiaRetornarItemsConStockBajo() throws Exception {
        when(inventarioService.listarStockBajo()).thenReturn(List.of(inventario));

        mockMvc.perform(get("/api/inventario/stock-bajo")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].stockActual").value(10));
    }

    @Test
    @WithMockUser(username = "mecanico@test.com", roles = {"MECANICO"})
    void obtenerPorId_existente_deberiaRetornarInventario() throws Exception {
        when(inventarioService.obtenerPorId(1L)).thenReturn(inventario);

        mockMvc.perform(get("/api/inventario/1")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.codigo").value("REP-001"))
                .andExpect(jsonPath("$.nombre").value("Filtro de aceite"));
    }

    @Test
    @WithMockUser(username = "mecanico@test.com", roles = {"MECANICO"})
    void obtenerPorCodigo_existente_deberiaRetornarInventario() throws Exception {
        when(inventarioService.obtenerPorCodigo("REP-001")).thenReturn(inventario);

        mockMvc.perform(get("/api/inventario/codigo/REP-001")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigo").value("REP-001"));
    }

    @Test
    @WithMockUser(username = "admin@taller.com", roles = {"ADMIN"})
    void crear_deberiaCrearInventario() throws Exception {
        Inventario inventarioCreado = Inventario.builder()
                .id(2L)
                .codigo("REP-002")
                .nombre("Pastillas de freno")
                .categoria("Frenos")
                .stockActual(20)
                .stockMinimo(5)
                .precioCompra(new BigDecimal("30.00"))
                .precioVenta(new BigDecimal("50.00"))
                .activo(true)
                .build();

        when(inventarioService.crear(any())).thenReturn(inventarioCreado);

        mockMvc.perform(post("/api/inventario")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.codigo").value("REP-002"))
                .andExpect(jsonPath("$.nombre").value("Pastillas de freno"));
    }

    @Test
    @WithMockUser(username = "admin@taller.com", roles = {"ADMIN"})
    void crear_datosInvalidos_deberiaRetornar400() throws Exception {
        InventarioRequest requestInvalido = InventarioRequest.builder()
                .codigo("")
                .nombre("")
                .precioCompra(BigDecimal.ZERO)
                .precioVenta(BigDecimal.ZERO)
                .build();

        mockMvc.perform(post("/api/inventario")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestInvalido)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.código").value("VALIDATION_ERROR"));
    }

    @Test
    @WithMockUser(username = "jefe@test.com", roles = {"JEFE_TALLER"})
    void actualizar_deberiaModificarInventario() throws Exception {
        InventarioRequest updateRequest = InventarioRequest.builder()
                .codigo("REP-001")
                .nombre("Filtro de aceite premium")
                .categoria("Filtros")
                .stockActual(25)
                .stockMinimo(10)
                .precioCompra(new BigDecimal("20.00"))
                .precioVenta(new BigDecimal("35.00"))
                .activo(true)
                .build();

        Inventario inventarioActualizado = Inventario.builder()
                .id(1L)
                .codigo("REP-001")
                .nombre("Filtro de aceite premium")
                .categoria("Filtros")
                .stockActual(25)
                .stockMinimo(10)
                .precioCompra(new BigDecimal("20.00"))
                .precioVenta(new BigDecimal("35.00"))
                .activo(true)
                .build();

        when(inventarioService.actualizar(eq(1L), any())).thenReturn(inventarioActualizado);

        mockMvc.perform(put("/api/inventario/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Filtro de aceite premium"))
                .andExpect(jsonPath("$.stockActual").value(25))
                .andExpect(jsonPath("$.precioVenta").value(35.00));
    }

    @Test
    @WithMockUser(username = "mecanico@test.com", roles = {"MECANICO"})
    void ajustarStock_incrementar_deberiaAumentarStock() throws Exception {
        Inventario inventarioActualizado = Inventario.builder()
                .id(1L)
                .codigo("REP-001")
                .stockActual(15)
                .build();

        when(inventarioService.ajustarStock(eq(1L), eq(5))).thenReturn(inventarioActualizado);

        mockMvc.perform(put("/api/inventario/1/stock")
                        .with(csrf())
                        .param("cantidad", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stockActual").value(15));
    }

    @Test
    @WithMockUser(username = "mecanico@test.com", roles = {"MECANICO"})
    void ajustarStock_decrementar_deberiaReducirStock() throws Exception {
        Inventario inventarioActualizado = Inventario.builder()
                .id(1L)
                .codigo("REP-001")
                .stockActual(5)
                .build();

        when(inventarioService.ajustarStock(eq(1L), eq(-5))).thenReturn(inventarioActualizado);

        mockMvc.perform(put("/api/inventario/1/stock")
                        .with(csrf())
                        .param("cantidad", "-5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stockActual").value(5));
    }

    @Test
    @WithMockUser(username = "admin@taller.com", roles = {"ADMIN"})
    void eliminar_deberiaRetornar204() throws Exception {
        mockMvc.perform(delete("/api/inventario/1")
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(username = "jefe@test.com", roles = {"JEFE_TALLER"})
    void eliminar_conRolJefeTaller_deberiaRetornar403() throws Exception {
        mockMvc.perform(delete("/api/inventario/1")
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void sinAutenticar_deberiaRetornar401() throws Exception {
        mockMvc.perform(get("/api/inventario"))
                .andExpect(status().isUnauthorized());
    }
}