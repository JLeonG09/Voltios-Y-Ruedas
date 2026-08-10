package com.voltiosyruedas.taller.inventario.service;

import com.voltiosyruedas.taller.inventario.dto.InventarioRequest;
import com.voltiosyruedas.taller.inventario.entity.Inventario;
import com.voltiosyruedas.taller.inventario.repository.InventarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class InventarioServiceIntegrationTest {

    @Autowired
    private InventarioService inventarioService;

    @Autowired
    private InventarioRepository inventarioRepository;

    @BeforeEach
    void setUp() {
        inventarioRepository.deleteAll();
    }

    @Test
    void crear_deberiaCrearRepuestoConValoresPorDefecto() {
        InventarioRequest request = InventarioRequest.builder()
                .codigo("REP-001")
                .nombre("Filtro de aceite")
                .descripcion("Filtro de aceite sintético")
                .categoria("Filtros")
                .marca("Bosch")
                .modelo("Universal")
                .stockActual(10)
                .stockMinimo(5)
                .precioCompra(new BigDecimal("15.00"))
                .precioVenta(new BigDecimal("25.00"))
                .ubicacion("Estante A-1")
                .proveedor("Distribuidora AutoParts")
                .build();

        Inventario inventario = inventarioService.crear(request);

        assertThat(inventario.getId()).isNotNull();
        assertThat(inventario.getCodigo()).isEqualTo("REP-001");
        assertThat(inventario.getNombre()).isEqualTo("Filtro de aceite");
        assertThat(inventario.getStockActual()).isEqualTo(10);
        assertThat(inventario.getStockMinimo()).isEqualTo(5);
        assertThat(inventario.getPrecioCompra()).isEqualTo(new BigDecimal("15.00"));
        assertThat(inventario.getPrecioVenta()).isEqualTo(new BigDecimal("25.00"));
        assertThat(inventario.getActivo()).isTrue();
    }

    @Test
    void crear_deberiaLanzarExcepcionSiCodigoDuplicado() {
        InventarioRequest request = InventarioRequest.builder()
                .codigo("REP-001")
                .nombre("Filtro de aceite")
                .categoria("Filtros")
                .build();

        inventarioService.crear(request);

        InventarioRequest request2 = InventarioRequest.builder()
                .codigo("REP-001")
                .nombre("Otro filtro")
                .categoria("Filtros")
                .build();

        assertThatThrownBy(() -> inventarioService.crear(request2))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Ya existe un repuesto con ese código");
    }

    @Test
    void listar_deberiaRetornarPaginaDeRepuestos() {
        InventarioRequest request1 = InventarioRequest.builder()
                .codigo("REP-001")
                .nombre("Filtro de aceite")
                .categoria("Filtros")
                .build();

        InventarioRequest request2 = InventarioRequest.builder()
                .codigo("REP-002")
                .nombre("Pastillas de freno")
                .categoria("Frenos")
                .build();

        inventarioService.crear(request1);
        inventarioService.crear(request2);

        Pageable pageable = PageRequest.of(0, 10);
        var page = inventarioService.listar(pageable);

        assertThat(page.getTotalElements()).isEqualTo(2);
        assertThat(page.getContent()).hasSize(2);
    }

    @Test
    void listarActivos_deberiaRetornarSoloActivos() {
        InventarioRequest request1 = InventarioRequest.builder()
                .codigo("REP-001")
                .nombre("Filtro de aceite")
                .categoria("Filtros")
                .activo(true)
                .build();

        InventarioRequest request2 = InventarioRequest.builder()
                .codigo("REP-002")
                .nombre("Pastillas de freno")
                .categoria("Frenos")
                .activo(false)
                .build();

        inventarioService.crear(request1);
        inventarioService.crear(request2);

        List<Inventario> activos = inventarioService.listarActivos();

        assertThat(activos).hasSize(1);
        assertThat(activos.get(0).getCodigo()).isEqualTo("REP-001");
    }

    @Test
    void listarPorCategoria_deberiaRetornarRepuestosDeCategoria() {
        InventarioRequest request1 = InventarioRequest.builder()
                .codigo("REP-001")
                .nombre("Filtro de aceite")
                .categoria("Filtros")
                .build();

        InventarioRequest request2 = InventarioRequest.builder()
                .codigo("REP-002")
                .nombre("Pastillas de freno")
                .categoria("Frenos")
                .build();

        inventarioService.crear(request1);
        inventarioService.crear(request2);

        List<Inventario> filtros = inventarioService.listarPorCategoria("Filtros");

        assertThat(filtros).hasSize(1);
        assertThat(filtros.get(0).getNombre()).isEqualTo("Filtro de aceite");
    }

    @Test
    void listarStockBajo_deberiaRetornarRepuestosConStockBajo() {
        InventarioRequest request1 = InventarioRequest.builder()
                .codigo("REP-001")
                .nombre("Filtro de aceite")
                .categoria("Filtros")
                .stockActual(3)
                .stockMinimo(5)
                .build();

        InventarioRequest request2 = InventarioRequest.builder()
                .codigo("REP-002")
                .nombre("Pastillas de freno")
                .categoria("Frenos")
                .stockActual(10)
                .stockMinimo(5)
                .build();

        inventarioService.crear(request1);
        inventarioService.crear(request2);

        List<Inventario> stockBajo = inventarioService.listarStockBajo();

        assertThat(stockBajo).hasSize(1);
        assertThat(stockBajo.get(0).getCodigo()).isEqualTo("REP-001");
    }

    @Test
    void actualizar_deberiaModificarRepuestoExistente() {
        InventarioRequest request = InventarioRequest.builder()
                .codigo("REP-001")
                .nombre("Filtro de aceite")
                .categoria("Filtros")
                .stockActual(10)
                .precioVenta(new BigDecimal("25.00"))
                .build();

        Inventario inventario = inventarioService.crear(request);

        InventarioRequest updateRequest = InventarioRequest.builder()
                .codigo("REP-001")
                .nombre("Filtro de aceite premium")
                .categoria("Filtros")
                .stockActual(20)
                .precioVenta(new BigDecimal("30.00"))
                .build();

        Inventario actualizado = inventarioService.actualizar(inventario.getId(), updateRequest);

        assertThat(actualizado.getNombre()).isEqualTo("Filtro de aceite premium");
        assertThat(actualizado.getStockActual()).isEqualTo(20);
        assertThat(actualizado.getPrecioVenta()).isEqualTo(new BigDecimal("30.00"));
    }

    @Test
    void ajustarStock_deberiaIncrementarStock() {
        InventarioRequest request = InventarioRequest.builder()
                .codigo("REP-001")
                .nombre("Filtro de aceite")
                .categoria("Filtros")
                .stockActual(10)
                .build();

        Inventario inventario = inventarioService.crear(request);

        Inventario actualizado = inventarioService.ajustarStock(inventario.getId(), 5);

        assertThat(actualizado.getStockActual()).isEqualTo(15);
    }

    @Test
    void ajustarStock_deberiaDecrementarStock() {
        InventarioRequest request = InventarioRequest.builder()
                .codigo("REP-001")
                .nombre("Filtro de aceite")
                .categoria("Filtros")
                .stockActual(10)
                .build();

        Inventario inventario = inventarioService.crear(request);

        Inventario actualizado = inventarioService.ajustarStock(inventario.getId(), -3);

        assertThat(actualizado.getStockActual()).isEqualTo(7);
    }

    @Test
    void ajustarStock_deberiaLanzarExcepcionSiStockNegativo() {
        InventarioRequest request = InventarioRequest.builder()
                .codigo("REP-001")
                .nombre("Filtro de aceite")
                .categoria("Filtros")
                .stockActual(2)
                .build();

        Inventario inventario = inventarioService.crear(request);

        assertThatThrownBy(() -> inventarioService.ajustarStock(inventario.getId(), -5))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("El stock no puede ser negativo");
    }

    @Test
    void eliminar_deberiaMarcarComoInactivo() {
        InventarioRequest request = InventarioRequest.builder()
                .codigo("REP-001")
                .nombre("Filtro de aceite")
                .categoria("Filtros")
                .build();

        Inventario inventario = inventarioService.crear(request);

        inventarioService.eliminar(inventario.getId());

        Inventario eliminado = inventarioService.obtenerPorId(inventario.getId());
        assertThat(eliminado.getActivo()).isFalse();
    }
}