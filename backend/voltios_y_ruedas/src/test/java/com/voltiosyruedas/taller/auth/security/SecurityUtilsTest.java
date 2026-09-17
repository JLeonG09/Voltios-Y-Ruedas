package com.voltiosyruedas.taller.auth.security;

import com.voltiosyruedas.taller.auth.entity.Rol;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.common.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.User;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SecurityUtilsTest {

    @Test
    void requerirUsuario_conPrincipalUsuario_devuelveUsuario() {
        Usuario usuario = Usuario.builder()
                .id(1L)
                .email("a@b.com")
                .password("x")
                .nombre("A")
                .apellido("B")
                .rol(new Rol(4L, "CLIENTE", "Cliente"))
                .activo(true)
                .emailVerificado(true)
                .build();
        var auth = new UsernamePasswordAuthenticationToken(usuario, null, usuario.getAuthorities());

        assertThat(SecurityUtils.requerirUsuario(auth).getId()).isEqualTo(1L);
    }

    @Test
    void requerirUsuario_conPrincipalNoUsuario_fallaCerrado401() {
        var springUser = User.withUsername("a@b.com").password("x").roles("CLIENTE").build();
        var auth = new UsernamePasswordAuthenticationToken(springUser, null, springUser.getAuthorities());

        assertThatThrownBy(() -> SecurityUtils.requerirUsuario(auth))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("No autenticado");
    }

    @Test
    void requerirUsuario_sinAuth_fallaCerrado401() {
        assertThatThrownBy(() -> SecurityUtils.requerirUsuario(null))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void requerirUsuario_anonimo_fallaCerrado401() {
        var auth = new UsernamePasswordAuthenticationToken("anonymousUser", null, List.of());
        assertThatThrownBy(() -> SecurityUtils.requerirUsuario(auth))
                .isInstanceOf(ApiException.class);
    }
}
