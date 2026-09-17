package com.voltiosyruedas.taller.auth.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Hash de refresh tokens para persistencia (SHA-256 hex).
 * Nunca loguear el token en claro ni el hash en contextos innecesarios.
 */
public final class TokenHashUtil {

    private TokenHashUtil() {
    }

    public static String sha256Hex(String valor) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("Token vacío");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(valor.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }
}
