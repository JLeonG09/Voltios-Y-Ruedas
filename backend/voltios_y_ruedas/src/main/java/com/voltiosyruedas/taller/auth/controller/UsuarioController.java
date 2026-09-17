package com.voltiosyruedas.taller.auth.controller;

import com.voltiosyruedas.taller.auditoria.service.AuditService;
import com.voltiosyruedas.taller.auth.dto.CambiarPasswordRequest;
import com.voltiosyruedas.taller.auth.dto.UsuarioRequest;
import com.voltiosyruedas.taller.auth.dto.UsuarioResponse;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.auth.security.SecurityUtils;
import com.voltiosyruedas.taller.auth.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER')")
    public ResponseEntity<Page<UsuarioResponse>> listar(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long rol,
            Pageable pageable) {
        Page<UsuarioResponse> respuesta = usuarioService.listar(pageable, search, rol)
                .map(usuarioService::toResponse);
        return ResponseEntity.ok(respuesta);
    }

    @GetMapping("/todos")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER')")
    public ResponseEntity<List<UsuarioResponse>> listarTodos() {
        List<UsuarioResponse> respuesta = usuarioService.listarTodos().stream()
                .map(usuarioService::toResponse)
                .toList();
        return ResponseEntity.ok(respuesta);
    }

    @GetMapping("/mecanicos")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER')")
    public ResponseEntity<List<UsuarioResponse>> obtenerMecanicos() {
        List<UsuarioResponse> respuesta = usuarioService.obtenerMecanicos().stream()
                .map(usuarioService::toResponse)
                .toList();
        return ResponseEntity.ok(respuesta);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER')")
    public ResponseEntity<UsuarioResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.toResponse(usuarioService.obtenerPorId(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UsuarioResponse> crear(@Valid @RequestBody UsuarioRequest request) {
        Usuario guardado = usuarioService.crear(request);
        auditService.registrar("CREAR_USUARIO", "USUARIO", guardado.getId(),
                "Creado el usuario " + guardado.getEmail());
        return ResponseEntity.ok(usuarioService.toResponse(guardado));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UsuarioResponse> actualizar(@PathVariable Long id, @Valid @RequestBody UsuarioRequest request) {
        Usuario guardado = usuarioService.actualizar(id, request);
        auditService.registrar("ACTUALIZAR_USUARIO", "USUARIO", id,
                "Actualizado el usuario " + guardado.getEmail());
        return ResponseEntity.ok(usuarioService.toResponse(guardado));
    }

    @PutMapping("/{id}/password")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public ResponseEntity<Void> cambiarPassword(@PathVariable Long id,
            @Valid @RequestBody CambiarPasswordRequest request) {
        usuarioService.cambiarPassword(id, request.getPasswordActual(), request.getPasswordNuevo());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        usuarioService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> getCurrentUser(Authentication authentication) {
        Usuario usuario = SecurityUtils.requerirUsuario(authentication);
        return ResponseEntity.ok(usuarioService.toResponse(usuario));
    }
}
