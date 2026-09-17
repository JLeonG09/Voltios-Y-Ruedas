package com.voltiosyruedas.taller.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.Set;

/**
 * Valida que una contraseña cumpla con los requisitos de seguridad:
 * - Mínimo 8 caracteres
 * - Al menos una letra mayúscula
 * - Al menos una letra minúscula
 * - Al menos un número
 * - Al menos un símbolo/especial
 * - No está en la lista de contraseñas comunes comprometidas
 */
public class ValidPasswordValidator implements ConstraintValidator<ValidPassword, String> {

    private static final Set<String> CONTRASENAS_COMUNES = Set.of(
            "12345678", "contraseña", "password123", "qwerty123", "123456789",
            "abc12345", "1234567890", "password1", "iloveyou", "1234567",
            "admin123", "letmein1", "welcome1", "monkey123", "dragon12",
            "master123", "shadow12", "sunshine1", "princess12", "football1",
            "passw0rd", "p@ssw0rd", "rootroot", "toor1234", "changeme1",
            "qwertyui", "abc123456", "11111111", "00000000", "password12"
    );

    @Override
    public boolean isValid(String value, ConstraintValidatorContext ctx) {
        if (value == null || value.isBlank()) {
            return true; // @NotBlank se encarga de nulls/vacíos
        }
        if (value.length() < 8) {
            return false;
        }
        if (!value.matches(".*[A-Z].*")) {
            return false;
        }
        if (!value.matches(".*[a-z].*")) {
            return false;
        }
        if (!value.matches(".*\\d.*")) {
            return false;
        }
        if (!value.matches(".*[^A-Za-z0-9].*")) {
            return false;
        }
        if (CONTRASENAS_COMUNES.contains(value.toLowerCase())) {
            return false;
        }
        return true;
    }
}
