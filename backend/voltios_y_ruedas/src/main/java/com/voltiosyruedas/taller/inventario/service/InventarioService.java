package com.voltiosyruedas.taller.inventario.service;

import com.voltiosyruedas.taller.common.exception.ApiException;
import com.voltiosyruedas.taller.inventario.dto.InventarioRequest;
import com.voltiosyruedas.taller.inventario.dto.InventarioResponse;
import com.voltiosyruedas.taller.inventario.entity.Inventario;
import com.voltiosyruedas.taller.inventario.repository.InventarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventarioService {

    private final InventarioRepository inventarioRepository;

    public Page<Inventario> listar(Pageable pageable) {
        return inventarioRepository.findAll(pageable);
    }

    public List<Inventario> listarActivos() {
        return inventarioRepository.findByActivoTrue();
    }

    public List<Inventario> listarPorCategoria(String categoria) {
        return inventarioRepository.findByCategoria(categoria);
    }

    public List<Inventario> listarStockBajo() {
        return inventarioRepository.findByStockActualLessThanEqualStockMinimo();
    }

    public Inventario obtenerPorId(Long id) {
        return inventarioRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Repuesto no encontrado"));
    }

    public Inventario obtenerPorCodigo(String codigo) {
        return inventarioRepository.findByCodigo(codigo)
                .orElseThrow(() -> ApiException.notFound("Repuesto no encontrado"));
    }

    public InventarioResponse toResponse(Inventario inventario) {
        return InventarioResponse.builder()
                .id(inventario.getId())
                .codigo(inventario.getCodigo())
                .nombre(inventario.getNombre())
                .descripcion(inventario.getDescripcion())
                .categoria(inventario.getCategoria())
                .marca(inventario.getMarca())
                .modelo(inventario.getModelo())
                .stockActual(inventario.getStockActual())
                .stockMinimo(inventario.getStockMinimo())
                .precioCompra(inventario.getPrecioCompra())
                .precioVenta(inventario.getPrecioVenta())
                .ubicacion(inventario.getUbicacion())
                .proveedor(inventario.getProveedor())
                .activo(inventario.getActivo())
                .fechaCreacion(inventario.getFechaCreacion())
                .fechaActualizacion(inventario.getFechaActualizacion())
                .build();
    }

    @Transactional
    public Inventario crear(InventarioRequest request) {
        if (inventarioRepository.findByCodigo(request.getCodigo()).isPresent()) {
            throw ApiException.conflict("Ya existe un repuesto con ese código");
        }

        Inventario inventario = Inventario.builder()
                .codigo(request.getCodigo())
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .categoria(request.getCategoria())
                .marca(request.getMarca())
                .modelo(request.getModelo())
                .stockActual(request.getStockActual() != null ? request.getStockActual() : 0)
                .stockMinimo(request.getStockMinimo() != null ? request.getStockMinimo() : 5)
                .precioCompra(request.getPrecioCompra() != null ? request.getPrecioCompra() : BigDecimal.ZERO)
                .precioVenta(request.getPrecioVenta() != null ? request.getPrecioVenta() : BigDecimal.ZERO)
                .ubicacion(request.getUbicacion())
                .proveedor(request.getProveedor())
                .activo(request.getActivo() != null ? request.getActivo() : true)
                .build();

        return inventarioRepository.save(inventario);
    }

    @Transactional
    public Inventario actualizar(Long id, InventarioRequest request) {
        Inventario inventario = obtenerPorId(id);

        if (!inventario.getCodigo().equals(request.getCodigo())) {
            if (inventarioRepository.findByCodigo(request.getCodigo()).isPresent()) {
                throw ApiException.conflict("Ya existe un repuesto con ese código");
            }
            inventario.setCodigo(request.getCodigo());
        }

        inventario.setNombre(request.getNombre());
        inventario.setDescripcion(request.getDescripcion());
        inventario.setCategoria(request.getCategoria());
        inventario.setMarca(request.getMarca());
        inventario.setModelo(request.getModelo());

        if (request.getStockActual() != null) {
            inventario.setStockActual(request.getStockActual());
        }
        if (request.getStockMinimo() != null) {
            inventario.setStockMinimo(request.getStockMinimo());
        }
        if (request.getPrecioCompra() != null) {
            inventario.setPrecioCompra(request.getPrecioCompra());
        }
        if (request.getPrecioVenta() != null) {
            inventario.setPrecioVenta(request.getPrecioVenta());
        }
        inventario.setUbicacion(request.getUbicacion());
        inventario.setProveedor(request.getProveedor());

        if (request.getActivo() != null) {
            inventario.setActivo(request.getActivo());
        }

        return inventarioRepository.save(inventario);
    }

    @Transactional
    public Inventario ajustarStock(Long id, Integer cantidad) {
        Inventario inventario = obtenerPorId(id);
        int nuevoStock = inventario.getStockActual() + cantidad;

        if (nuevoStock < 0) {
            throw ApiException.badRequest("El stock no puede ser negativo");
        }

        inventario.setStockActual(nuevoStock);
        return inventarioRepository.save(inventario);
    }

    @Transactional
    public void eliminar(Long id) {
        Inventario inventario = obtenerPorId(id);
        inventario.setActivo(false);
        inventarioRepository.save(inventario);
    }
}
