package com.voltiosyruedas.taller.auth.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltiosyruedas.taller.common.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.header.writers.XXssProtectionHeaderWriter;

import java.time.LocalDateTime;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private RateLimitingFilter rateLimitingFilter;

    @Autowired
    @Lazy
    private UserDetailsService userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/api/usuarios/**").hasAnyRole("ADMIN", "JEFE_TALLER")
                        .requestMatchers("/api/reservas/**").hasAnyRole("ADMIN", "JEFE_TALLER", "MECANICO", "CLIENTE")
                        .requestMatchers("/api/ordenes/**").hasAnyRole("ADMIN", "JEFE_TALLER", "MECANICO", "CLIENTE")
                        .requestMatchers("/api/inventario/**").hasAnyRole("ADMIN", "JEFE_TALLER", "MECANICO")
                        .requestMatchers("/api/vehiculos/**").hasAnyRole("ADMIN", "JEFE_TALLER", "MECANICO", "CLIENTE")
                        .requestMatchers("/api/notificaciones/**").hasAnyRole("ADMIN", "JEFE_TALLER", "MECANICO", "CLIENTE")
                        .requestMatchers("/api/auditoria/**").hasAnyRole("ADMIN", "JEFE_TALLER")
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setCharacterEncoding("UTF-8");
                            ErrorResponse body = ErrorResponse.builder()
                                    .código("UNAUTHORIZED")
                                    .mensaje("No autenticado")
                                    .detalles(List.of("Se requiere un token JWT válido"))
                                    .timestamp(LocalDateTime.now())
                                    .build();
                            response.getWriter().write(objectMapper.writeValueAsString(body));
                        }))
                .headers(headers -> headers
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31536000))
                        .frameOptions(frame -> frame.deny())
                        .xssProtection(xss -> xss
                                .headerValue(XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK))
                        .contentSecurityPolicy(csp -> csp
                                .policyDirectives("default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'"))
                        .referrerPolicy(referrer -> referrer
                                .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.SAME_ORIGIN))
                        .cacheControl(cache -> cache.disable()))
                .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Factor de trabajo >= 12 según AGENTS.md (sección 2.1 - Contraseñas).
     * Cada incremento duplica el coste de cómputo del hash. 12 es el mínimo
     * exigido por la guía del proyecto.
     */
    private static final int BCRYPT_STRENGTH = 12;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(BCRYPT_STRENGTH);
    }
}