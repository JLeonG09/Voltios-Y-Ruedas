package com.voltiosyruedas.taller.notificaciones.controller;

import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.notificaciones.entity.Notificacion;
import com.voltiosyruedas.taller.notificaciones.service.NotificacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
@Tag(name = "Notificaciones", description = "Notificaciones del usuario autenticado")
public class NotificacionController {

    private final NotificacionService notificacionService;

    @GetMapping
    @Operation(summary = "Listar notificaciones del usuario", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<Notificacion>> listar(Authentication authentication) {
        Usuario usuario = (Usuario) authentication.getPrincipal();
        return ResponseEntity.ok(notificacionService.listarPorUsuario(usuario.getId()));
    }

    @GetMapping("/no-leidas")
    @Operation(summary = "Contar notificaciones no leídas", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Long> contarNoLeidas(Authentication authentication) {
        Usuario usuario = (Usuario) authentication.getPrincipal();
        return ResponseEntity.ok(notificacionService.contarNoLeidas(usuario.getId()));
    }

    @PutMapping("/{id}/leida")
    @Operation(summary = "Marcar una notificación como leída", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Notificacion> marcarLeida(@PathVariable Long id, Authentication authentication) {
        Usuario usuario = (Usuario) authentication.getPrincipal();
        return ResponseEntity.ok(notificacionService.marcarLeida(id, usuario.getId()));
    }

    @PutMapping("/leer-todas")
    @Operation(summary = "Marcar todas las notificaciones como leídas", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> marcarTodasLeidas(Authentication authentication) {
        Usuario usuario = (Usuario) authentication.getPrincipal();
        notificacionService.marcarTodasLeidas(usuario.getId());
        return ResponseEntity.ok().build();
    }
}
