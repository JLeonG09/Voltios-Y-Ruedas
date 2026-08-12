package com.voltiosyruedas.taller.common.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.net.URI;

/**
 * Configuracion de Redis para Render.
 * Render inyecta REDIS_URL con formato "redis://user:pass@host:port" (o "rediss://"
 * si usa TLS), que se convierte en los componentes individuales que espera
 * Lettuce. Solo se activa cuando REDIS_URL esta presente (Render).
 */
@Configuration
@ConditionalOnProperty(name = "REDIS_URL")
public class RenderRedisConfig {

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        String redisUrl = System.getenv("REDIS_URL");
        URI uri = URI.create(redisUrl.replaceFirst("^rediss?://", "http://"));

        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName(uri.getHost());
        config.setPort(uri.getPort() == -1 ? 6379 : uri.getPort());
        if (uri.getUserInfo() != null) {
            String[] parts = uri.getUserInfo().split(":", 2);
            if (parts.length > 0 && !parts[0].isEmpty()) {
                config.setUsername(parts[0]);
            }
            if (parts.length > 1) {
                config.setPassword(parts[1]);
            }
        }

        LettuceClientConfiguration clientConfig = redisUrl.startsWith("rediss://")
                ? LettuceClientConfiguration.builder().useSsl().build()
                : LettuceClientConfiguration.builder().build();

        return new LettuceConnectionFactory(config, clientConfig);
    }

    @Bean
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory redisConnectionFactory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(redisConnectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new StringRedisSerializer());
        template.afterPropertiesSet();
        return template;
    }
}
