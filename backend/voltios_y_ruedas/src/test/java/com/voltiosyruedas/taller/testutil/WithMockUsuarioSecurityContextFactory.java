package com.voltiosyruedas.taller.testutil;

import com.voltiosyruedas.taller.auth.entity.Rol;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithSecurityContextFactory;

import java.time.LocalDateTime;

/**
 * Construye un SecurityContext cuyo principal es la entidad {@code Usuario}
 * (id 1), coherente con el filtro JWT de producción.
 */
public class WithMockUsuarioSecurityContextFactory implements WithSecurityContextFactory<WithMockUsuario> {

    @Override
    public SecurityContext createSecurityContext(WithMockUsuario annotation) {
        Rol rol = new Rol(idDelRol(annotation.rol()), annotation.rol(), annotation.rol() + " del taller");
        Usuario usuario = Usuario.builder()
                .id(1L)
                .nombre("Usuario")
                .apellido("Autenticado")
                .email(annotation.username())
                .password("encodedPassword")
                .rol(rol)
                .activo(true)
                .emailVerificado(true)
                .fechaCreacion(LocalDateTime.now())
                .fechaActualizacion(LocalDateTime.now())
                .build();

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                usuario, null, usuario.getAuthorities());

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        return context;
    }

    private Long idDelRol(String nombre) {
        return switch (nombre) {
            case "ADMIN" -> 1L;
            case "JEFE_TALLER" -> 2L;
            case "MECANICO" -> 3L;
            case "CLIENTE" -> 4L;
            default -> 0L;
        };
    }
}