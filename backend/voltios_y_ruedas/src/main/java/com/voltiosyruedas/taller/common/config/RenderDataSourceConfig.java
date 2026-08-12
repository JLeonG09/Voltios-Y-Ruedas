package com.voltiosyruedas.taller.common.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.net.URI;

/**
 * Configuracion de DataSource para Render.
 * Render inyecta DATABASE_URL con formato "postgresql://user:pass@host:port/db",
 * que debe convertirse a una URL JDBC antes de usarse con Hibernate/Flyway.
 * Solo se activa cuando la variable DATABASE_URL esta presente (Render).
 */
@Configuration
@ConditionalOnProperty(name = "DATABASE_URL")
public class RenderDataSourceConfig {

    @Bean
    public DataSource dataSource() {
        URI uri = URI.create(System.getenv("DATABASE_URL"));
        String[] userInfo = uri.getUserInfo() != null ? uri.getUserInfo().split(":", 2) : new String[0];

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl("jdbc:postgresql://" + uri.getHost()
                + (uri.getPort() == -1 ? ":5432" : ":" + uri.getPort())
                + uri.getPath());
        dataSource.setUsername(userInfo.length > 0 ? userInfo[0] : "");
        dataSource.setPassword(userInfo.length > 1 ? userInfo[1] : "");
        dataSource.setDriverClassName("org.postgresql.Driver");
        return dataSource;
    }
}
