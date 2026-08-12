package com.voltiosyruedas.taller.auth.entity;

import com.voltiosyruedas.taller.auth.dto.RegisterRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UsuarioValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        factory.close();
    }

    private Set<ConstraintViolation<Usuario>> validar(String nombre, String apellido, String email, String password) {
        Usuario usuario = new Usuario();
        usuario.setNombre(nombre);
        usuario.setApellido(apellido);
        usuario.setEmail(email);
        usuario.setPassword(password);
        return validator.validate(usuario);
    }

    @Test
    void usuarioValido_noTieneViolaciones() {
        Set<ConstraintViolation<Usuario>> violaciones =
                validar("Juan Carlos", "Pérez Ochoa", "juan.carlos@ejemplo.com", "secreto1");
        assertTrue(violaciones.isEmpty(), "No debería haber violaciones: " + violaciones);
    }

    @Test
    void nombreConNumeros_esInvalido() {
        Set<ConstraintViolation<Usuario>> violaciones =
                validar("Juan123", "Pérez", "juan@ejemplo.com", "secreto1");
        assertFalse(violaciones.isEmpty(), "Nombre con números no debería pasar");
    }

    @Test
    void apellidoConNumeros_esInvalido() {
        Set<ConstraintViolation<Usuario>> violaciones =
                validar("Juan", "Pérez2", "juan@ejemplo.com", "secreto1");
        assertFalse(violaciones.isEmpty(), "Apellido con números no debería pasar");
    }

    @Test
    void emailDebil_esInvalido() {
        Set<ConstraintViolation<Usuario>> violaciones =
                validar("Juan", "Pérez", "2@m.com", "secreto1");
        assertFalse(violaciones.isEmpty(), "Email débil no debería pasar");
    }

    @Test
    void passwordCorta_esInvalida() {
        Set<ConstraintViolation<Usuario>> violaciones =
                validar("Juan", "Pérez", "juan@ejemplo.com", "123");
        assertFalse(violaciones.isEmpty(), "Contraseña corta no debería pasar");
    }

    @Test
    void passwordNull_esValidoEnEdicion() {
        // En edición el password no se envía (queda null), no debe bloquear la actualización
        Set<ConstraintViolation<Usuario>> violaciones =
                validar("Juan", "Pérez", "juan@ejemplo.com", null);
        assertTrue(violaciones.isEmpty(), "Password nulo en edición no debería fallar: " + violaciones);
    }

    @Test
    void lasReglasCoincidenConRegisterRequest() {
        RegisterRequest request = RegisterRequest.builder()
                .nombre("Juan Carlos")
                .apellido("Pérez Ochoa")
                .email("juan.carlos@ejemplo.com")
                .password("secreto1")
                .build();
        assertTrue(validator.validate(request).isEmpty());
    }
}
