package com.voltiosyruedas.taller.inventario.controller;

import com.voltiosyruedas.taller.inventario.dto.InventarioRequest;
import com.voltiosyruedas.taller.inventario.dto.InventarioResponse;
import com.voltiosyruedas.taller.inventario.entity.Inventario;
import com.voltiosyruedas.taller.inventario.service.InventarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventario")
@RequiredArgsConstructor
public class InventarioController {

    private final InventarioService inventarioService;

    @GetMapping
    public ResponseEntity<Page<Inventario>> listar(Pageable pageable) {
        return ResponseEntity.ok(inventarioService.listar(pageable));
    }

    @GetMapping("/activos")
    public ResponseEntity<List<Inventario>> listarActivos() {
        return ResponseEntity.ok(inventarioService.listarActivos());
    }

    @GetMapping("/categoria/{categoria}")
    public ResponseEntity<List<Inventario>> listarPorCategoria(@PathVariable String categoria) {
        return ResponseEntity.ok(inventarioService.listarPorCategoria(categoria));
    }

    @GetMapping("/stock-bajo")
    public ResponseEntity<List<Inventario>> listarStockBajo() {
        return ResponseEntity.ok(inventarioService.listarStockBajo());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Inventario> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(inventarioService.obtenerPorId(id));
    }

    @GetMapping("/codigo/{codigo}")
    public ResponseEntity<Inventario> obtenerPorCodigo(@PathVariable String codigo) {
        return ResponseEntity.ok(inventarioService.obtenerPorCodigo(codigo));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER')")
    public ResponseEntity<Inventario> crear(@Valid @RequestBody InventarioRequest request) {
        return ResponseEntity.ok(inventarioService.crear(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER')")
    public ResponseEntity<Inventario> actualizar(@PathVariable Long id, @Valid @RequestBody InventarioRequest request) {
        return ResponseEntity.ok(inventarioService.actualizar(id, request));
    }

    @PutMapping("/{id}/stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<Inventario> ajustarStock(@PathVariable Long id, @RequestParam Integer cantidad) {
        return ResponseEntity.ok(inventarioService.ajustarStock(id, cantidad));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        inventarioService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}