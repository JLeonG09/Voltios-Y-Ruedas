package com.voltiosyruedas.taller.auth.service;

import com.voltiosyruedas.taller.auth.dto.LoginRequest;
import com.voltiosyruedas.taller.auth.dto.RegisterRequest;
import com.voltiosyruedas.taller.auth.entity.Rol;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.auth.repository.RolRepository;
import com.voltiosyruedas.taller.auth.repository.UsuarioRepository;
import com.voltiosyruedas.taller.auth.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthServiceIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Rol rolCliente;

    @BeforeEach
    void setUp() {
        usuarioRepository.deleteAll();
        rolCliente = rolRepository.findByNombre("CLIENTE").orElseThrow();
    }

    @Test
    void registrar_deberiaCrearUsuarioConRolClientePorDefecto() {
        RegisterRequest request = RegisterRequest.builder()
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan.perez@test.com")
                .password("password123")
                .telefono("123456789")
                .direccion("Calle Falsa 123")
                .build();

        Usuario usuario = authService.registrar(request);

        assertThat(usuario.getId()).isNotNull();
        assertThat(usuario.getNombre()).isEqualTo("Juan");
        assertThat(usuario.getApellido()).isEqualTo("Pérez");
        assertThat(usuario.getEmail()).isEqualTo("juan.perez@test.com");
        assertThat(passwordEncoder.matches("password123", usuario.getPassword())).isTrue();
        assertThat(usuario.getRol().getNombre()).isEqualTo("CLIENTE");
        assertThat(usuario.getActivo()).isTrue();
    }

    @Test
    void registrar_deberiaLanzarExcepcionSiEmailYaExiste() {
        RegisterRequest request = RegisterRequest.builder()
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan.perez@test.com")
                .password("password123")
                .build();

        authService.registrar(request);

        assertThatThrownBy(() -> authService.registrar(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("El email ya está registrado");
    }

    @Test
    void login_deberiaRetornarTokenValido() {
        RegisterRequest registerRequest = RegisterRequest.builder()
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan.perez@test.com")
                .password("password123")
                .build();

        authService.registrar(registerRequest);

        LoginRequest loginRequest = LoginRequest.builder()
                .email("juan.perez@test.com")
                .password("password123")
                .build();

        String token = authService.login(loginRequest);

        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
    }

    @Test
    void login_deberiaLanzarExcepcionSiCredencialesInvalidas() {
        RegisterRequest registerRequest = RegisterRequest.builder()
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan.perez@test.com")
                .password("password123")
                .build();

        authService.registrar(registerRequest);

        LoginRequest loginRequest = LoginRequest.builder()
                .email("juan.perez@test.com")
                .password("wrongpassword")
                .build();

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(RuntimeException.class);
    }
}