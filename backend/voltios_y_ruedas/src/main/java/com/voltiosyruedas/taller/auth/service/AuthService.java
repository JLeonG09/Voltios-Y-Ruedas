package com.voltiosyruedas.taller.auth.service;

import com.voltiosyruedas.taller.auth.dto.LoginRequest;
import com.voltiosyruedas.taller.auth.dto.RegisterRequest;
import com.voltiosyruedas.taller.auth.entity.Rol;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.auth.repository.RolRepository;
import com.voltiosyruedas.taller.auth.repository.UsuarioRepository;
import com.voltiosyruedas.taller.auth.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public Usuario registrar(RegisterRequest request) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("El email ya está registrado");
        }

        Rol rol = rolRepository.findById(request.getRolId() != null ? request.getRolId() : 4L)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));

        Usuario usuario = Usuario.builder()
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .telefono(request.getTelefono())
                .direccion(request.getDireccion())
                .rol(rol)
                .activo(true)
                .build();

        return usuarioRepository.save(usuario);
    }

    public String login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserDetails userDetails = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return jwtUtil.generateToken(userDetails, userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", ""));
    }
}