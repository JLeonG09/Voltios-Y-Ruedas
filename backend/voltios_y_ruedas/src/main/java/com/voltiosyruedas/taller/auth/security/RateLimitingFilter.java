package com.voltiosyruedas.taller.auth.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitingFilter.class);

    /** Límites por endpoint crítico. Clave: path exacto, valor: capacidad + ventana. */
    private static final Map<String, RateLimitConfig> LIMITS = Map.ofEntries(
            Map.entry("/api/auth/login",            new RateLimitConfig(5,  Duration.ofMinutes(1))),
            Map.entry("/api/auth/refresh",          new RateLimitConfig(10, Duration.ofMinutes(1))),
            Map.entry("/api/auth/verificar-email",  new RateLimitConfig(10, Duration.ofMinutes(1))),
            Map.entry("/api/auth/reenviar-codigo",  new RateLimitConfig(3,  Duration.ofMinutes(5))),
            Map.entry("/api/auth/recuperar-password", new RateLimitConfig(3, Duration.ofMinutes(5))),
            Map.entry("/api/auth/register",         new RateLimitConfig(3,  Duration.ofMinutes(5)))
    );

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    /**
     * Solo confiar en X-Forwarded-For / X-Real-IP si hay un proxy conocido delante
     * (nginx del compose). Por defecto false → se usa remoteAddr (anti spoofing).
     * Ver docs/second-brain/Ciberseguridad/seguridad.md.
     */
    @Value("${app.security.trust-forwarded-headers:false}")
    private boolean trustForwardedHeaders;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        RateLimitConfig config = LIMITS.get(path);

        if (config != null && "POST".equalsIgnoreCase(request.getMethod())) {
            String clientIp = getClientIp(request);
            String bucketKey = path + ":" + clientIp;
            Bucket bucket = buckets.computeIfAbsent(bucketKey, k -> createNewBucket(config));

            if (bucket.tryConsume(1)) {
                filterChain.doFilter(request, response);
            } else {
                logger.warn("Rate limit excedido para {} desde IP {}", path, clientIp);
                response.setStatus(429);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write(
                        "{\"código\":\"RATE_LIMIT_EXCEEDED\",\"mensaje\":\"Demasiadas solicitudes. Intente más tarde.\",\"timestamp\":\""
                                + java.time.LocalDateTime.now() + "\"}");
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }

    private Bucket createNewBucket(RateLimitConfig config) {
        Bandwidth limit = Bandwidth.classic(config.maxRequests(),
                Refill.intervally(config.maxRequests(), config.timeWindow()));
        return Bucket.builder().addLimit(limit).build();
    }

    private String getClientIp(HttpServletRequest request) {
        if (trustForwardedHeaders) {
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                return xForwardedFor.split(",")[0].trim();
            }
            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isEmpty()) {
                return xRealIp;
            }
        }
        return request.getRemoteAddr();
    }

    /** Configuración de rate limit para un endpoint. */
    private record RateLimitConfig(int maxRequests, Duration timeWindow) {}
}
