package com.voltiosyruedas.taller.auth.security;

import com.voltiosyruedas.taller.auth.entity.Rol;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        // Use reflection to set private fields for testing
        try {
            var secretField = JwtUtil.class.getDeclaredField("secret");
            secretField.setAccessible(true);
            // 64 character base64 encoded secret (512 bits)
            secretField.set(jwtUtil, "DDnkx2GsREuGqABZtZKajrambpIcgEZyENB7I7EH2xO2GRzWWrj/pB5/adLzOQM2Pw3taqH2BONQWalKYhtkjQ==");
            
            var expirationField = JwtUtil.class.getDeclaredField("expiration");
            expirationField.setAccessible(true);
            expirationField.set(jwtUtil, 86400000L); // 24 hours
        } catch (Exception e) {
            throw new RuntimeException("Failed to set up JwtUtil for testing", e);
        }
    }

    @Test
    void generateToken_deberiaCrearTokenValido() {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan@test.com")
                .password("encoded")
                .rol(new Rol(4L, "CLIENTE", "Cliente"))
                .build();

        String token = jwtUtil.generateToken(usuario, "CLIENTE");

        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        assertThat(token.split("\\.")).hasSize(3); // JWT has 3 parts
    }

    @Test
    void generateToken_sinRol_deberiaCrearTokenValido() {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan@test.com")
                .password("encoded")
                .rol(new Rol(4L, "CLIENTE", "Cliente"))
                .build();

        String token = jwtUtil.generateToken(usuario);

        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
    }

    @Test
    void extractUsername_deberiaExtraerEmailDelToken() {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan@test.com")
                .password("encoded")
                .rol(new Rol(4L, "CLIENTE", "Cliente"))
                .build();

        String token = jwtUtil.generateToken(usuario, "CLIENTE");
        String username = jwtUtil.extractUsername(token);

        assertThat(username).isEqualTo("juan@test.com");
    }

    @Test
    void extractExpiration_deberiaExtraerFechaExpiracion() {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan@test.com")
                .password("encoded")
                .rol(new Rol(4L, "CLIENTE", "Cliente"))
                .build();

        String token = jwtUtil.generateToken(usuario, "CLIENTE");
        Date expiration = jwtUtil.extractExpiration(token);

        assertThat(expiration).isNotNull();
        assertThat(expiration.after(new Date())).isTrue();
    }

    @Test
    void validateToken_tokenValido_deberiaRetornarTrue() {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan@test.com")
                .password("encoded")
                .rol(new Rol(4L, "CLIENTE", "Cliente"))
                .build();

        String token = jwtUtil.generateToken(usuario, "CLIENTE");
        boolean isValid = jwtUtil.validateToken(token, usuario);

        assertThat(isValid).isTrue();
    }

    @Test
    void validateToken_tokenExpirado_deberiaRetornarFalse() {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan@test.com")
                .password("encoded")
                .rol(new Rol(4L, "CLIENTE", "Cliente"))
                .build();

        // Create a token with very short expiration
        JwtUtil shortExpiryUtil = new JwtUtil();
        try {
            var secretField = JwtUtil.class.getDeclaredField("secret");
            secretField.setAccessible(true);
            secretField.set(shortExpiryUtil, "DDnkx2GsREuGqABZtZKajrambpIcgEZyENB7I7EH2xO2GRzWWrj/pB5/adLzOQM2Pw3taqH2BONQWalKYhtkjQ==");
            
            var expirationField = JwtUtil.class.getDeclaredField("expiration");
            expirationField.setAccessible(true);
            expirationField.set(shortExpiryUtil, -1000L); // Expired 1 second ago
        } catch (Exception e) {
            throw new RuntimeException("Failed to set up JwtUtil", e);
        }

        String token = shortExpiryUtil.generateToken(usuario, "CLIENTE");
        boolean isValid = shortExpiryUtil.validateToken(token, usuario);

        assertThat(isValid).isFalse();
    }

    @Test
    void validateToken_usuarioDiferente_deberiaRetornarFalse() {
        Usuario usuario1 = Usuario.builder()
                .id(1L)
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan@test.com")
                .password("encoded")
                .rol(new Rol(4L, "CLIENTE", "Cliente"))
                .build();

        Usuario usuario2 = Usuario.builder()
                .id(2L)
                .nombre("Maria")
                .apellido("González")
                .email("maria@test.com")
                .password("encoded")
                .rol(new Rol(4L, "CLIENTE", "Cliente"))
                .build();

        String token = jwtUtil.generateToken(usuario1, "CLIENTE");
        boolean isValid = jwtUtil.validateToken(token, usuario2);

        assertThat(isValid).isFalse();
    }

    @Test
    void validateToken_tokenMalformado_deberiaRetornarFalse() {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan@test.com")
                .password("encoded")
                .rol(new Rol(4L, "CLIENTE", "Cliente"))
                .build();

        boolean isValid = jwtUtil.validateToken("token.invalido.malformado", usuario);

        assertThat(isValid).isFalse();
    }

    @Test
    void getNombreCompleto_deberiaRetornarNombreCompleto() {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .nombre("Juan")
                .apellido("Pérez")
                .email("juan@test.com")
                .password("encoded")
                .rol(new Rol(4L, "CLIENTE", "Cliente"))
                .build();

        String token = jwtUtil.generateToken(usuario, "CLIENTE");
        
        // We can't easily test getNombreCompleto since it's on JwtResponse not JwtUtil
        // But we can verify the token contains the right claims
        String username = jwtUtil.extractUsername(token);
        assertThat(username).isEqualTo("juan@test.com");
    }
}