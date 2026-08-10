package com.voltiosyruedas.taller.auth.security;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Service
public class TokenBlacklistService {

    private static final String BLACKLIST_PREFIX = "blacklist:";

    private final RedisTemplate<String, String> redisTemplate;

    public TokenBlacklistService(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void blacklistToken(String token, long expirationTimeMillis) {
        long ttlSeconds = TimeUnit.MILLISECONDS.toSeconds(expirationTimeMillis);
        if (ttlSeconds > 0) {
            redisTemplate.opsForValue().set(
                    BLACKLIST_PREFIX + token,
                    "true",
                    Duration.ofSeconds(ttlSeconds)
            );
        }
    }

    public boolean isBlacklisted(String token) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + token));
    }

    public void removeFromBlacklist(String token) {
        redisTemplate.delete(BLACKLIST_PREFIX + token);
    }
}