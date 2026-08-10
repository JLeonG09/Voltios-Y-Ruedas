package com.voltiosyruedas.taller.reservas.controller;

import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.reservas.dto.ReservaRequest;
import com.voltiosyruedas.taller.reservas.dto.ReservaResponse;
import com.voltiosyruedas.taller.reservas.entity.Reserva;
import com.voltiosyruedas.taller.reservas.service.ReservaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/reservas")
@RequiredArgsConstructor
public class ReservaController {

    private final ReservaService reservaService;

    @GetMapping
    public ResponseEntity<Page<Reserva>> listar(Pageable pageable) {
        return ResponseEntity.ok(reservaService.listar(pageable));
    }

    @GetMapping("/mis-reservas")
    public ResponseEntity<List<Reserva>> misReservas(Authentication authentication) {
        Usuario usuario = (Usuario) authentication.getPrincipal();
        return ResponseEntity.ok(reservaService.listarPorCliente(usuario));
    }

    @GetMapping("/fecha")
    public ResponseEntity<List<Reserva>> listarPorFecha(
            @RequestParam LocalDateTime inicio,
            @RequestParam LocalDateTime fin) {
        return ResponseEntity.ok(reservaService.listarPorFecha(inicio, fin));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Reserva> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(reservaService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<Reserva> crear(Authentication authentication, @Valid @RequestBody ReservaRequest request) {
        Usuario usuario = (Usuario) authentication.getPrincipal();
        return ResponseEntity.ok(reservaService.crear(usuario, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Reserva> actualizar(@PathVariable Long id, @Valid @RequestBody ReservaRequest request) {
        return ResponseEntity.ok(reservaService.actualizar(id, request));
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<Reserva> cambiarEstado(@PathVariable Long id, @RequestParam String estado) {
        return ResponseEntity.ok(reservaService.cambiarEstado(id, estado));
    }

    @PutMapping("/{id}/cancelar")
    public ResponseEntity<Void> cancelar(@PathVariable Long id) {
        reservaService.cancelar(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        reservaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}