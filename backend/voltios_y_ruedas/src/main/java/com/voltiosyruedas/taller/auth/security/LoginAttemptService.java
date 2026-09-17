package com.voltiosyruedas.taller.auth.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Account lockout tras intentos fallidos de login.
 * Usa Redis para rastrear conteos por email con TTL,
 * permitiendo bloqueo distribuido en múltiples instancias.
 *
 * - 5 intentos fallidos → bloqueo de 15 minutos
 * - Login exitoso limpia el contador
 */
@Service
public class LoginAttemptService {

    private static final Logger logger = LoggerFactory.getLogger(LoginAttemptService.class);

    private static final int MAX_INTENTOS = 5;
    private static final Duration BLOQUEO = Duration.ofMinutes(15);
    private static final String PREFIXO_INTENTOS = "login:attempts:";
    private static final String PREFIXO_BLOQUEO = "login:locked:";

    private final RedisTemplate<String, String> redisTemplate;

    public LoginAttemptService(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /** Registra un intento fallido y, si corresponde, bloquea la cuenta. */
    public void registrarIntentoFallido(String email) {
        String key = PREFIXO_INTENTOS + email.toLowerCase();
        long intentos = redisTemplate.opsForValue().increment(key, 1);
        if (intentos == 1) {
            redisTemplate.expire(key, BLOQUEO);
        }
        if (intentos >= MAX_INTENTOS) {
            redisTemplate.opsForValue().set(PREFIXO_BLOQUEO + email.toLowerCase(),
                    "bloqueado", BLOQUEO);
            logger.warn("Cuenta bloqueada por {} intentos fallidos: {}", MAX_INTENTOS, email);
        }
    }

    /** Verifica si una cuenta está bloqueada. */
    public boolean estaBloqueada(String email) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(
                PREFIXO_BLOQUEO + email.toLowerCase()));
    }

    /** Limpia los intentos fallidos tras un login exitoso. */
    public void limpiarIntentos(String email) {
        redisTemplate.delete(PREFIXO_INTENTOS + email.toLowerCase());
        redisTemplate.delete(PREFIXO_BLOQUEO + email.toLowerCase());
    }

    /** Tiempo restante de bloqueo en segundos (0 si no está bloqueada). */
    public long tiempoBloqueoRestanteSegundos(String email) {
        String key = PREFIXO_BLOQUEO + email.toLowerCase();
        Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
        return ttl != null && ttl > 0 ? ttl : 0;
    }
}
