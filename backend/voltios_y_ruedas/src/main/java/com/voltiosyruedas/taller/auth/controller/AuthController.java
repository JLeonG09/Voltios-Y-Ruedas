package com.voltiosyruedas.taller.auth.controller;

import com.voltiosyruedas.taller.auth.dto.JwtResponse;
import com.voltiosyruedas.taller.auth.dto.LoginRequest;
import com.voltiosyruedas.taller.auth.dto.RegisterRequest;
import com.voltiosyruedas.taller.auth.dto.UsuarioResponse;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        String token = authService.login(request);
        Usuario usuario = (Usuario) org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();

        JwtResponse response = JwtResponse.builder()
                .token(token)
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .email(usuario.getEmail())
                .rol(usuario.getRol().getNombre())
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<UsuarioResponse> register(@Valid @RequestBody RegisterRequest request) {
        Usuario usuario = authService.registrar(request);
        
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