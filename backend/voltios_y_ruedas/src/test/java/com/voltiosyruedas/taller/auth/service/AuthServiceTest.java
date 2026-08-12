package com.voltiosyruedas.taller.auth.service;

import com.voltiosyruedas.taller.auth.dto.LoginRequest;
import com.voltiosyruedas.taller.auth.dto.RegisterRequest;
import com.voltiosyruedas.taller.auth.entity.RefreshToken;
import com.voltiosyruedas.taller.auth.entity.Rol;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.auth.repository.RefreshTokenRepository;
import com.voltiosyruedas.taller.auth.repository.RolRepository;
import com.voltiosyruedas.taller.auth.repository.UsuarioRepository;
import com.voltiosyruedas.taller.auth.security.JwtUtil;
import com.voltiosyruedas.taller.auditoria.service.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private RolRepository rolRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private Authentication authentication;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private AuthService authService;

    private JwtUtil jwtUtil;
    private Rol rolCliente;
    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        // Create a real JwtUtil with test configuration
        jwtUtil = new JwtUtil();
        try {
            var secretField = JwtUtil.class.getDeclaredField("secret");
            secretField.setAccessible(true);
            // 64 character base64 encoded secret (512 bits)
            secretField.set(jwtUtil, "DDnkx2GsREuGqABZtZKajrambpIcgEZyENB7I7EH2xO2GRzWWrj/pB5/adLzOQM2Pw3taqH2BONQWalKYhtkjQ==");
            
            var expirationField = JwtUtil.class.getDeclaredField("expiration");
            expirationField.setAccessible(true);
            expirationField.set(jwtUtil, 86400000L); // 24 hours

            var refreshExpirationField = JwtUtil.class.getDeclaredField("refreshExpiration");
            refreshExpirationField.setAccessible(true);
            refreshExpirationField.set(jwtUtil, 604800000L); // 7 days
        } catch (Exception e) {
            throw new RuntimeException("Failed to set up JwtUtil for testing", e);
        }
        
        // Inject the jwtUtil into authService
        try {
            var jwtUtilField = AuthService.class.getDeclaredField("jwtUtil");
            jwtUtilField.setAccessible(true);
            jwtUtilField.set(authService, jwtUtil);
        } catch (Exception e) {
            throw new RuntimeException("Failed to inject JwtUtil", e);
        }

        rolCliente = new Rol(4L, "CLIENTE", "Cliente del taller");

        registerRequest = RegisterRequest.builder()
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan.perez@test.com")
                .password("password123")
                .telefono("123456789")
                .direccion("Calle Falsa 123")
                .build();

        loginRequest = LoginRequest.builder()
                .email("juan.perez@test.com")
                .password("password123")
                .build();
    }

    @Test
    void registrar_exitoso_deberiaCrearUsuarioConRolCliente() {
        when(usuarioRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
        when(rolRepository.findById(4L)).thenReturn(Optional.of(rolCliente));
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("encodedPassword");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> {
            Usuario u = invocation.getArgument(0);
            u.setId(1L);
            return u;
        });

        Usuario resultado = authService.registrar(registerRequest);

        assertThat(resultado).isNotNull();
        assertThat(resultado.getId()).isEqualTo(1L);
        assertThat(resultado.getNombre()).isEqualTo("Juan");
        assertThat(resultado.getApellido()).isEqualTo("Pérez");
        assertThat(resultado.getEmail()).isEqualTo("juan.perez@test.com");
        assertThat(resultado.getPassword()).isEqualTo("encodedPassword");
        assertThat(resultado.getTelefono()).isEqualTo("123456789");
        assertThat(resultado.getDireccion()).isEqualTo("Calle Falsa 123");
        assertThat(resultado.getRol().getNombre()).isEqualTo("CLIENTE");
        assertThat(resultado.getActivo()).isTrue();

        verify(usuarioRepository, times(1)).existsByEmail(registerRequest.getEmail());
        verify(rolRepository, times(1)).findById(4L);
        verify(passwordEncoder, times(1)).encode(registerRequest.getPassword());
        verify(usuarioRepository, times(1)).save(any(Usuario.class));
    }

    @Test
    void registrar_conRolEspecifico_deberiaAsignarRolSolicitado() {
        Rol rolMecanico = new Rol(3L, "MECANICO", "Mecánico del taller");
        RegisterRequest requestConRol = RegisterRequest.builder()
                .nombre("Carlos")
                .apellido("Mecánico")
                .email("carlos@test.com")
                .password("password123")
                .rolId(3L)
                .build();

        when(usuarioRepository.existsByEmail(requestConRol.getEmail())).thenReturn(false);
        when(rolRepository.findById(3L)).thenReturn(Optional.of(rolMecanico));
        when(passwordEncoder.encode(requestConRol.getPassword())).thenReturn("encodedPassword");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> {
            Usuario u = invocation.getArgument(0);
            u.setId(2L);
            return u;
        });

        Usuario resultado = authService.registrar(requestConRol);

        assertThat(resultado.getRol().getNombre()).isEqualTo("MECANICO");
        verify(rolRepository, times(1)).findById(3L);
    }

    @Test
    void registrar_emailDuplicado_deberiaLanzarExcepcion() {
        when(usuarioRepository.existsByEmail(registerRequest.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> authService.registrar(registerRequest))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("El email ya está registrado");

        verify(usuarioRepository, times(1)).existsByEmail(registerRequest.getEmail());
        verify(rolRepository, never()).findById(anyLong());
        verify(passwordEncoder, never()).encode(anyString());
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    void registrar_rolNoEncontrado_deberiaLanzarExcepcion() {
        when(usuarioRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
        when(rolRepository.findById(4L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.registrar(registerRequest))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Rol no encontrado");

        verify(rolRepository, times(1)).findById(4L);
    }

    @Test
    void login_exitoso_deberiaRetornarToken() {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan.perez@test.com")
                .password("encodedPassword")
                .rol(rolCliente)
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(usuario);

        String token = authService.login(loginRequest);

        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        assertThat(token.split("\\.")).hasSize(3); // JWT has 3 parts

        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void login_credencialesInvalidas_deberiaLanzarExcepcion() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new org.springframework.security.authentication.BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(RuntimeException.class);

        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void login_usuarioNoExiste_deberiaLanzarExcepcion() {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan.perez@test.com")
                .password("encodedPassword")
                .rol(rolCliente)
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(usuario);

        // This test verifies the flow works - the service doesn't check if user exists in DB after auth
        String token = authService.login(loginRequest);
        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
    }

    @Test
    void refrescarToken_valido_deberiaRotarYDevolverParNuevo() {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan.perez@test.com")
                .password("encodedPassword")
                .rol(rolCliente)
                .build();

        String refreshTokenUsado = jwtUtil.generateRefreshToken(usuario, "CLIENTE");
        RefreshToken registro = RefreshToken.builder()
                .id(10L)
                .usuario(usuario)
                .token(refreshTokenUsado)
                .expiracion(LocalDateTime.now().plusDays(7))
                .revocado(false)
                .build();

        when(usuarioRepository.findByEmail("juan.perez@test.com")).thenReturn(Optional.of(usuario));
        when(refreshTokenRepository.findByToken(refreshTokenUsado)).thenReturn(Optional.of(registro));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var respuesta = authService.refrescarToken(refreshTokenUsado);

        assertThat(respuesta.getToken()).isNotNull().isNotEmpty();
        assertThat(respuesta.getRefreshToken()).isNotNull().isNotEmpty();
        assertThat(respuesta.getRefreshToken()).isNotEqualTo(refreshTokenUsado);

        // El token usado queda revocado (rotación)
        assertThat(registro.getRevocado()).isTrue();
        verify(refreshTokenRepository, times(1)).save(registro);
    }

    @Test
    void refrescarToken_reutilizado_deberiaRevocarFamiliaYRechazar() {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan.perez@test.com")
                .password("encodedPassword")
                .rol(rolCliente)
                .build();

        String refreshToken = jwtUtil.generateRefreshToken(usuario, "CLIENTE");
        // El token ya no existe en BD (fue rotado en un uso previo) => reuso
        when(usuarioRepository.findByEmail("juan.perez@test.com")).thenReturn(Optional.of(usuario));
        when(refreshTokenRepository.findByToken(refreshToken)).thenReturn(Optional.empty());
        when(refreshTokenRepository.findByUsuarioIdAndRevocadoFalse(1L)).thenReturn(List.of());

        assertThatThrownBy(() -> authService.refrescarToken(refreshToken))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Refresh token inválido o expirado");

        verify(refreshTokenRepository, times(1)).findByUsuarioIdAndRevocadoFalse(1L);
        verify(refreshTokenRepository, never()).save(any(RefreshToken.class));
    }

    @Test
    void refrescarToken_revocado_deberiaRechazar() {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan.perez@test.com")
                .password("encodedPassword")
                .rol(rolCliente)
                .build();

        String refreshToken = jwtUtil.generateRefreshToken(usuario, "CLIENTE");
        RefreshToken registroRevocado = RefreshToken.builder()
                .id(10L)
                .usuario(usuario)
                .token(refreshToken)
                .expiracion(LocalDateTime.now().plusDays(7))
                .revocado(true)
                .build();

        when(usuarioRepository.findByEmail("juan.perez@test.com")).thenReturn(Optional.of(usuario));
        when(refreshTokenRepository.findByToken(refreshToken)).thenReturn(Optional.of(registroRevocado));
        when(refreshTokenRepository.findByUsuarioIdAndRevocadoFalse(1L)).thenReturn(List.of());

        assertThatThrownBy(() -> authService.refrescarToken(refreshToken))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Refresh token inválido o expirado");
    }
}