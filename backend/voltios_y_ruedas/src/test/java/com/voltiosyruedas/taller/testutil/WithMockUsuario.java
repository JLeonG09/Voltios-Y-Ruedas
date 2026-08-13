package com.voltiosyruedas.taller.testutil;

import org.springframework.security.test.context.support.WithSecurityContext;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Permite autenticar con un {@code Usuario} real como principal del SecurityContext.
 * Resuelve el problema de castear {@code authentication.getPrincipal()} a
 * {@code Usuario} (el filtro JWT de producción deja la entidad; {@code @WithMockUser}
 * deja un {@code User} de Spring Security y rompería ese casteo en los controllers).
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = WithMockUsuarioSecurityContextFactory.class)
public @interface WithMockUsuario {
    String username() default "admin@taller.com";

    String rol() default "ADMIN";
}