package com.voltiosyruedas.taller.auth.service;

import com.voltiosyruedas.taller.common.exception.ApiException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
public class PasswordResetService {

    private static final String PREFIX = "reset:";
    private static final Duration TTL = Duration.ofHours(1);

    private final RedisTemplate<String, String> redisTemplate;

    public PasswordResetService(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public String crearToken(String email) {
        String token = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(PREFIX + token, email, TTL);
        return token;
    }

    public String obtenerEmailPorToken(String token) {
        String email = redisTemplate.opsForValue().get(PREFIX + token);
        if (email == null || email.isBlank()) {
            throw ApiException.unauthorized("El token de recuperación es inválido o ha expirado");
        }
        return email;
    }

    public void eliminarToken(String token) {
        redisTemplate.delete(PREFIX + token);
    }
}
