package com.voltiosyruedas.taller.inventario.controller;

import com.voltiosyruedas.taller.auditoria.service.AuditService;
import com.voltiosyruedas.taller.inventario.dto.InventarioRequest;
import com.voltiosyruedas.taller.inventario.dto.InventarioResponse;
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
    public ResponseEntity<Page<InventarioResponse>> listar(Pageable pageable) {
        return ResponseEntity.ok(inventarioService.listar(pageable).map(inventarioService::toResponse));
    }

    @GetMapping("/activos")
    public ResponseEntity<List<InventarioResponse>> listarActivos() {
        return ResponseEntity.ok(inventarioService.listarActivos().stream()
                .map(inventarioService::toResponse)
                .toList());
    }

    @GetMapping("/categoria/{categoria}")
    public ResponseEntity<List<InventarioResponse>> listarPorCategoria(@PathVariable String categoria) {
        return ResponseEntity.ok(inventarioService.listarPorCategoria(categoria).stream()
                .map(inventarioService::toResponse)
                .toList());
    }

    @GetMapping("/stock-bajo")
    public ResponseEntity<List<InventarioResponse>> listarStockBajo() {
        return ResponseEntity.ok(inventarioService.listarStockBajo().stream()
                .map(inventarioService::toResponse)
                .toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventarioResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(inventarioService.toResponse(inventarioService.obtenerPorId(id)));
    }

    @GetMapping("/codigo/{codigo}")
    public ResponseEntity<InventarioResponse> obtenerPorCodigo(@PathVariable String codigo) {
        return ResponseEntity.ok(inventarioService.toResponse(inventarioService.obtenerPorCodigo(codigo)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER')")
    public ResponseEntity<InventarioResponse> crear(@Valid @RequestBody InventarioRequest request) {
        Inventario creado = inventarioService.crear(request);
        auditService.registrar("CREAR_REPUESTO", "INVENTARIO", creado.getId(),
                "Creado el repuesto " + creado.getCodigo());
        notificarStockBajo(creado);
        return ResponseEntity.ok(inventarioService.toResponse(creado));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER')")
    public ResponseEntity<InventarioResponse> actualizar(@PathVariable Long id, @Valid @RequestBody InventarioRequest request) {
        Inventario actualizado = inventarioService.actualizar(id, request);
        auditService.registrar("ACTUALIZAR_REPUESTO", "INVENTARIO", id,
                "Actualizado el repuesto " + actualizado.getCodigo());
        notificarStockBajo(actualizado);
        return ResponseEntity.ok(inventarioService.toResponse(actualizado));
    }

    @PutMapping("/{id}/stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<InventarioResponse> ajustarStock(@PathVariable Long id, @RequestParam Integer cantidad) {
        Inventario actualizado = inventarioService.ajustarStock(id, cantidad);
        auditService.registrar("AJUSTAR_STOCK", "INVENTARIO", id,
                "Stock ajustado en " + cantidad + " (nuevo: " + actualizado.getStockActual() + ")");
        notificarStockBajo(actualizado);
        return ResponseEntity.ok(inventarioService.toResponse(actualizado));
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
