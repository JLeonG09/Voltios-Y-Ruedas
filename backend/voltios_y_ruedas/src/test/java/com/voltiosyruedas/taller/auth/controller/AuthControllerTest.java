package com.voltiosyruedas.taller.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltiosyruedas.taller.auth.dto.JwtResponse;
import com.voltiosyruedas.taller.auth.dto.LoginRequest;
import com.voltiosyruedas.taller.auth.dto.RegisterRequest;
import com.voltiosyruedas.taller.auth.dto.UsuarioResponse;
import com.voltiosyruedas.taller.auth.entity.Rol;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.auth.security.JwtUtil;
import com.voltiosyruedas.taller.auth.service.AuthService;
import com.voltiosyruedas.taller.auth.service.UsuarioService;
import com.voltiosyruedas.taller.common.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private UsuarioService usuarioService;

    @MockBean
    private JwtUtil jwtUtil;

    @Test
    void login_exitoso_deberiaRetornarTokenYUsuario() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("admin@taller.com")
                .password("password123")
                .build();

        Usuario usuario = Usuario.builder()
                .id(1L)
                .nombre("Admin")
                .apellido("Sistema")
                .email("admin@taller.com")
                .password("encodedPassword")
                .rol(new Rol(1L, "ADMIN", "Administrador"))
                .activo(true)
                .fechaCreacion(LocalDateTime.now())
                .fechaActualizacion(LocalDateTime.now())
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn("mocked-jwt-token");
        when(usuarioService.obtenerPorEmail("admin@taller.com")).thenReturn(usuario);

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mocked-jwt-token"))
                .andExpect(jsonPath("$.tipo").value("Bearer"))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nombre").value("Admin"))
                .andExpect(jsonPath("$.apellido").value("Sistema"))
                .andExpect(jsonPath("$.email").value("admin@taller.com"))
                .andExpect(jsonPath("$.rol").value("ADMIN"));
    }

    @Test
    void login_credencialesInvalidas_deberiaRetornar401() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("admin@taller.com")
                .password("wrongpassword")
                .build();

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(ApiException.unauthorized("Credenciales inválidas"));

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.código").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.mensaje").value("Credenciales inválidas"));
    }

    @Test
    void login_emailInvalido_deberiaRetornar400() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("email-invalido")
                .password("password123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.código").value("VALIDATION_ERROR"));
    }

    @Test
    void login_passwordCorta_deberiaRetornar400() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("admin@taller.com")
                .password("123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.código").value("VALIDATION_ERROR"));
    }

    @Test
    void register_exitoso_deberiaCrearUsuarioYRetornar200() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan.perez@test.com")
                .password("password123")
                .telefono("123456789")
                .direccion("Calle Falsa 123")
                .build();

        when(authService.registrar(any(RegisterRequest.class))).thenAnswer(invocation -> {
            RegisterRequest req = invocation.getArgument(0);
            return Usuario.builder()
                    .id(1L)
                    .nombre(req.getNombre())
                    .apellido(req.getApellido())
                    .email(req.getEmail())
                    .password("encoded")
                    .telefono(req.getTelefono())
                    .direccion(req.getDireccion())
                    .rol(new Rol(4L, "CLIENTE", "Cliente del taller"))
                    .activo(true)
                    .fechaCreacion(LocalDateTime.now())
                    .fechaActualizacion(LocalDateTime.now())
                    .build();
        });

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nombre").value("Juan"))
                .andExpect(jsonPath("$.apellido").value("Pérez"))
                .andExpect(jsonPath("$.email").value("juan.perez@test.com"))
                .andExpect(jsonPath("$.rol.nombre").value("CLIENTE"));
    }

    @Test
    void register_emailDuplicado_deberiaRetornar409() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan.perez@test.com")
                .password("password123")
                .build();

        when(authService.registrar(any(RegisterRequest.class)))
                .thenThrow(ApiException.conflict("El email ya está registrado"));

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.código").value("CONFLICT"))
                .andExpect(jsonPath("$.mensaje").value("El email ya está registrado"));
    }

    @Test
    void register_datosInvalidos_deberiaRetornar400() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .nombre("")
                .apellido("")
                .email("email-invalido")
                .password("123")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.código").value("VALIDATION_ERROR"));
    }

    @Test
    @WithMockUser(username = "admin@taller.com", roles = {"ADMIN"})
    void me_autenticado_deberiaRetornarUsuarioActual() throws Exception {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .nombre("Admin")
                .apellido("Sistema")
                .email("admin@taller.com")
                .password("encodedPassword")
                .rol(new Rol(1L, "ADMIN", "Administrador"))
                .activo(true)
                .fechaCreacion(LocalDateTime.now())
                .fechaActualizacion(LocalDateTime.now())
                .build();

        when(usuarioService.obtenerPorEmail("admin@taller.com")).thenReturn(usuario);

        mockMvc.perform(get("/api/auth/me")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nombre").value("Admin"))
                .andExpect(jsonPath("$.email").value("admin@taller.com"))
                .andExpect(jsonPath("$.rol.nombre").value("ADMIN"));
    }

    @Test
    void me_sinAutenticar_deberiaRetornar401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }
}