package com.voltiosyruedas.taller.auth.controller;

import com.voltiosyruedas.taller.auth.dto.UsuarioResponse;
import com.voltiosyruedas.taller.auth.entity.Usuario;
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

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER')")
    public ResponseEntity<Page<Usuario>> listar(Pageable pageable) {
        return ResponseEntity.ok(usuarioService.listar(pageable));
    }

    @GetMapping("/todos")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER')")
    public ResponseEntity<List<Usuario>> listarTodos() {
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

    @GetMapping("/mecanicos")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER')")
    public ResponseEntity<List<Usuario>> obtenerMecanicos() {
        return ResponseEntity.ok(usuarioService.obtenerMecanicos());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER')")
    public ResponseEntity<Usuario> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.obtenerPorId(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Usuario> crear(@Valid @RequestBody Usuario usuario) {
        return ResponseEntity.ok(usuarioService.crear(usuario));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Usuario> actualizar(@PathVariable Long id, @Valid @RequestBody Usuario usuario) {
        return ResponseEntity.ok(usuarioService.actualizar(id, usuario));
    }

    @PutMapping("/{id}/password")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public ResponseEntity<Void> cambiarPassword(@PathVariable Long id, 
            @RequestParam String passwordActual, 
            @RequestParam String passwordNuevo) {
        usuarioService.cambiarPassword(id, passwordActual, passwordNuevo);
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
        Usuario usuario = (Usuario) authentication.getPrincipal();

        UsuarioResponse response = UsuarioResponse.builder()
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .email(usuario.getEmail())
                .telefono(usuario.getTelefono())
                .direccion(usuario.getDireccion())
                .activo(usuario.getActivo())
                .fechaCreacion(usuario.getFechaCreacion())
                .fechaActualizacion(usuario.getFechaActualizacion())
                .rol(UsuarioResponse.RolResponse.builder()
                        .id(usuario.getRol().getId())
                        .nombre(usuario.getRol().getNombre())
                        .descripcion(usuario.getRol().getDescripcion())
                        .build())
                .build();

        return ResponseEntity.ok(response);
    }
}