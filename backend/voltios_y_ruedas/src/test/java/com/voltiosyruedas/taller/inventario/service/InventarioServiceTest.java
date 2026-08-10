package com.voltiosyruedas.taller.inventario.service;

import com.voltiosyruedas.taller.inventario.dto.InventarioRequest;
import com.voltiosyruedas.taller.inventario.entity.Inventario;
import com.voltiosyruedas.taller.inventario.repository.InventarioRepository;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventarioServiceTest {

    @Mock
    private InventarioRepository inventarioRepository;

    @InjectMocks
    private InventarioService inventarioService;

    private InventarioRequest crearRequest;
    private Inventario inventario;

    @BeforeEach
    void setUp() {
        crearRequest = InventarioRequest.builder()
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
                .activo(true)
                .build();

        inventario = Inventario.builder()
                .id(1L)
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
                .activo(true)
                .build();
    }

    @Test
    void crear_deberiaCrearRepuestoConValoresPorDefecto() {
        when(inventarioRepository.findByCodigo("REP-001")).thenReturn(Optional.empty());
        when(inventarioRepository.save(any(Inventario.class))).thenAnswer(invocation -> {
            Inventario i = invocation.getArgument(0);
            i.setId(1L);
            return i;
        });

        Inventario resultado = inventarioService.crear(crearRequest);

        assertThat(resultado).isNotNull();
        assertThat(resultado.getId()).isEqualTo(1L);
        assertThat(resultado.getCodigo()).isEqualTo("REP-001");
        assertThat(resultado.getNombre()).isEqualTo("Filtro de aceite");
        assertThat(resultado.getStockActual()).isEqualTo(10);
        assertThat(resultado.getStockMinimo()).isEqualTo(5);
        assertThat(resultado.getPrecioCompra()).isEqualTo(new BigDecimal("15.00"));
        assertThat(resultado.getPrecioVenta()).isEqualTo(new BigDecimal("25.00"));
        assertThat(resultado.getActivo()).isTrue();

        verify(inventarioRepository, times(1)).findByCodigo("REP-001");
        verify(inventarioRepository, times(1)).save(any(Inventario.class));
    }

    @Test
    void crear_codigoDuplicado_deberiaLanzarExcepcion() {
        when(inventarioRepository.findByCodigo("REP-001")).thenReturn(Optional.of(inventario));

        assertThatThrownBy(() -> inventarioService.crear(crearRequest))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Ya existe un repuesto con ese código");

        verify(inventarioRepository, times(1)).findByCodigo("REP-001");
        verify(inventarioRepository, never()).save(any(Inventario.class));
    }

    @Test
    void listar_deberiaRetornarPaginaDeRepuestos() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Inventario> page = new PageImpl<>(List.of(inventario, inventario), pageable, 2);

        when(inventarioRepository.findAll(pageable)).thenReturn(page);

        Page<Inventario> resultado = inventarioService.listar(pageable);

        assertThat(resultado).isNotNull();
        assertThat(resultado.getTotalElements()).isEqualTo(2);
        assertThat(resultado.getContent()).hasSize(2);

        verify(inventarioRepository, times(1)).findAll(pageable);
    }

    @Test
    void listarActivos_deberiaRetornarSoloActivos() {
        Inventario inactivo = Inventario.builder()
                .id(2L)
                .codigo("REP-002")
                .nombre("Pastillas de freno")
                .activo(false)
                .build();

        when(inventarioRepository.findByActivoTrue()).thenReturn(List.of(inventario));

        List<Inventario> resultado = inventarioService.listarActivos();

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getActivo()).isTrue();
        verify(inventarioRepository, times(1)).findByActivoTrue();
    }

    @Test
    void listarPorCategoria_deberiaRetornarRepuestosDeCategoria() {
        when(inventarioRepository.findByCategoria("Filtros")).thenReturn(List.of(inventario));

        List<Inventario> resultado = inventarioService.listarPorCategoria("Filtros");

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getCategoria()).isEqualTo("Filtros");
        verify(inventarioRepository, times(1)).findByCategoria("Filtros");
    }

    @Test
    void listarStockBajo_deberiaRetornarRepuestosConStockBajo() {
        Inventario stockBajo = Inventario.builder()
                .id(2L)
                .codigo("REP-002")
                .nombre("Pastillas de freno")
                .stockActual(3)
                .stockMinimo(5)
                .activo(true)
                .build();

        when(inventarioRepository.findByStockActualLessThanEqualStockMinimo()).thenReturn(List.of(stockBajo));

        List<Inventario> resultado = inventarioService.listarStockBajo();

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getStockActual()).isLessThanOrEqualTo(resultado.get(0).getStockMinimo());
        verify(inventarioRepository, times(1)).findByStockActualLessThanEqualStockMinimo();
    }

    @Test
    void obtenerPorId_existente_deberiaRetornarInventario() {
        when(inventarioRepository.findById(1L)).thenReturn(Optional.of(inventario));

        Inventario resultado = inventarioService.obtenerPorId(1L);

        assertThat(resultado).isNotNull();
        assertThat(resultado.getId()).isEqualTo(1L);
        verify(inventarioRepository, times(1)).findById(1L);
    }

    @Test
    void obtenerPorId_inexistente_deberiaLanzarExcepcion() {
        when(inventarioRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inventarioService.obtenerPorId(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Repuesto no encontrado con ID: 999");
    }

    @Test
    void obtenerPorCodigo_existente_deberiaRetornarInventario() {
        when(inventarioRepository.findByCodigo("REP-001")).thenReturn(Optional.of(inventario));

        Inventario resultado = inventarioService.obtenerPorCodigo("REP-001");

        assertThat(resultado).isNotNull();
        assertThat(resultado.getCodigo()).isEqualTo("REP-001");
        verify(inventarioRepository, times(1)).findByCodigo("REP-001");
    }

    @Test
    void actualizar_deberiaModificarInventarioExistente() {
        InventarioRequest updateRequest = InventarioRequest.builder()
                .codigo("REP-001")
                .nombre("Filtro de aceite premium")
                .descripcion("Filtro de alta gama")
                .categoria("Filtros")
                .marca("Bosch Premium")
                .modelo("Universal Plus")
                .stockActual(20)
                .stockMinimo(10)
                .precioCompra(new BigDecimal("20.00"))
                .precioVenta(new BigDecimal("35.00"))
                .ubicacion("Estante A-2")
                .proveedor("Distribuidora Premium")
                .activo(true)
                .build();

        when(inventarioRepository.findById(1L)).thenReturn(Optional.of(inventario));
        when(inventarioRepository.findByCodigo("REP-001")).thenReturn(Optional.of(inventario));
        when(inventarioRepository.save(any(Inventario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Inventario resultado = inventarioService.actualizar(1L, updateRequest);

        assertThat(resultado.getNombre()).isEqualTo("Filtro de aceite premium");
        assertThat(resultado.getStockActual()).isEqualTo(20);
        assertThat(resultado.getStockMinimo()).isEqualTo(10);
        assertThat(resultado.getPrecioCompra()).isEqualTo(new BigDecimal("20.00"));
        assertThat(resultado.getPrecioVenta()).isEqualTo(new BigDecimal("35.00"));

        verify(inventarioRepository, times(1)).findById(1L);
        verify(inventarioRepository, times(1)).save(any(Inventario.class));
    }

    @Test
    void actualizar_codigoNuevoDuplicado_deberiaLanzarExcepcion() {
        Inventario otroInventario = Inventario.builder()
                .id(2L)
                .codigo("REP-002")
                .nombre("Otro repuesto")
                .build();

        InventarioRequest updateRequest = InventarioRequest.builder()
                .codigo("REP-002")
                .nombre("Filtro modificado")
                .build();

        when(inventarioRepository.findById(1L)).thenReturn(Optional.of(inventario));
        when(inventarioRepository.findByCodigo("REP-002")).thenReturn(Optional.of(otroInventario));

        assertThatThrownBy(() -> inventarioService.actualizar(1L, updateRequest))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Ya existe un repuesto con ese código");
    }

    @Test
    void ajustarStock_incrementar_deberiaAumentarStock() {
        when(inventarioRepository.findById(1L)).thenReturn(Optional.of(inventario));
        when(inventarioRepository.save(any(Inventario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Inventario resultado = inventarioService.ajustarStock(1L, 5);

        assertThat(resultado.getStockActual()).isEqualTo(15);
        verify(inventarioRepository, times(1)).findById(1L);
        verify(inventarioRepository, times(1)).save(argThat(i -> i.getStockActual() == 15));
    }

    @Test
    void ajustarStock_decrementar_deberiaReducirStock() {
        when(inventarioRepository.findById(1L)).thenReturn(Optional.of(inventario));
        when(inventarioRepository.save(any(Inventario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Inventario resultado = inventarioService.ajustarStock(1L, -3);

        assertThat(resultado.getStockActual()).isEqualTo(7);
        verify(inventarioRepository, times(1)).save(argThat(i -> i.getStockActual() == 7));
    }

    @Test
    void ajustarStock_stockNegativo_deberiaLanzarExcepcion() {
        when(inventarioRepository.findById(1L)).thenReturn(Optional.of(inventario));

        assertThatThrownBy(() -> inventarioService.ajustarStock(1L, -15))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("El stock no puede ser negativo");
    }

    @Test
    void eliminar_deberiaMarcarComoInactivo() {
        when(inventarioRepository.findById(1L)).thenReturn(Optional.of(inventario));
        when(inventarioRepository.save(any(Inventario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        inventarioService.eliminar(1L);

        verify(inventarioRepository, times(1)).findById(1L);
        verify(inventarioRepository, times(1)).save(argThat(i -> !i.getActivo()));
    }
}