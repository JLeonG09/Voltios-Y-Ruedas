package com.voltiosyruedas.taller.inventario.controller;

import com.voltiosyruedas.taller.auditoria.service.AuditService;
import com.voltiosyruedas.taller.inventario.dto.InventarioRequest;
import com.voltiosyruedas.taller.inventario.entity.Inventario;
import com.voltiosyruedas.taller.inventario.service.InventarioService;
import com.voltiosyruedas.taller.notificaciones.service.NotificacionService;
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
    private final NotificacionService notificacionService;
    private final AuditService auditService;

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
        Inventario creado = inventarioService.crear(request);
        auditService.registrar("CREAR_REPUESTO", "INVENTARIO", creado.getId(),
                "Creado el repuesto " + creado.getCodigo());
        notificarStockBajo(creado);
        return ResponseEntity.ok(creado);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER')")
    public ResponseEntity<Inventario> actualizar(@PathVariable Long id, @Valid @RequestBody InventarioRequest request) {
        Inventario actualizado = inventarioService.actualizar(id, request);
        auditService.registrar("ACTUALIZAR_REPUESTO", "INVENTARIO", id,
                "Actualizado el repuesto " + actualizado.getCodigo());
        notificarStockBajo(actualizado);
        return ResponseEntity.ok(actualizado);
    }

    @PutMapping("/{id}/stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<Inventario> ajustarStock(@PathVariable Long id, @RequestParam Integer cantidad) {
        Inventario actualizado = inventarioService.ajustarStock(id, cantidad);
        auditService.registrar("AJUSTAR_STOCK", "INVENTARIO", id,
                "Stock ajustado en " + cantidad + " (nuevo: " + actualizado.getStockActual() + ")");
        notificarStockBajo(actualizado);
        return ResponseEntity.ok(actualizado);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        inventarioService.eliminar(id);
        auditService.registrar("ELIMINAR_REPUESTO", "INVENTARIO", id, "Repuesto desactivado");
        return ResponseEntity.noContent().build();
    }

    private void notificarStockBajo(Inventario inventario) {
        try {
            if (inventario != null && inventario.isStockBajo() && Boolean.TRUE.equals(inventario.getActivo())) {
                notificacionService.notificarAStaff("Stock bajo",
                        inventario.getNombre() + " (" + inventario.getCodigo() +
                                ") por debajo del mínimo: " + inventario.getStockActual() +
                                " / " + inventario.getStockMinimo(), "inventario");
            }
        } catch (Exception e) {
            // La notificación nunca debe impedir completar la operación
        }
    }
}
