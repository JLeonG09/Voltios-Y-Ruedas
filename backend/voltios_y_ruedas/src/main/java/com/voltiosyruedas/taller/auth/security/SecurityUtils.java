package com.voltiosyruedas.taller.auth.security;

import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.common.exception.ApiException;
import org.springframework.security.core.Authentication;

/**
 * Resolución fail-closed del principal autenticado como {@link Usuario}.
 */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    /**
     * Exige un {@link Usuario} como principal. Si falta autenticación o el
     * tipo no es el esperado → 401 (nunca retorna vacío ni hace cast crudo).
     */
    public static Usuario requerirUsuario(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw ApiException.unauthorized("No autenticado");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof Usuario usuario) {
            return usuario;
        }
        throw ApiException.unauthorized("No autenticado");
    }
}
