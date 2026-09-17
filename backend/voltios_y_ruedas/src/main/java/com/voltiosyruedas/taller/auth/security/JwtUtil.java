package com.voltiosyruedas.taller.auth.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    /**
     * Valores de ejemplo que jamás deben usarse en producción. Si la app arranca
     * con uno de ellos, se aborta para evitar firmar tokens con una clave pública.
     */
    private static final List<String> SECRETOS_INSEGUROS = List.of(
            "miClaveSecretaMuyLargaYSeguraParaJWT2024!",
            "min-32-caracteres-cambiar-en-produccion!!!",
            "cambiar-en-produccion",
            "generar-con-openssl-rand-base64-64"
    );

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:900000}")
    private Long expiration;

    @Value("${jwt.refresh.expiration:43200000}")
    private Long refreshExpiration;

    /**
     * Fail-fast: sin JWT_SECRET (o con un valor inseguro) la app no debe arrancar.
     * Imposible firmar/validar tokens con una clave débil o conocida públicamente.
     */
    @PostConstruct
    public void validarSecreto() {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET no está definido. Configúralo en la variable de entorno "
                    + "JWT_SECRET (mínimo 32 caracteres, ideal 64). Genera uno con: "
                    + "openssl rand -base64 64");
        }
        if (secret.trim().length() < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET debe tener al menos 32 caracteres (se encontraron "
                    + secret.trim().length() + "). Genera uno con: openssl rand -base64 64");
        }
        String valor = secret.trim();
        for (String inseguro : SECRETOS_INSEGUROS) {
            if (valor.equals(inseguro)) {
                throw new IllegalStateException(
                        "JWT_SECRET usa un valor por defecto inseguro. Genera uno real con: "
                        + "openssl rand -base64 64");
            }
        }
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, userDetails.getUsername(), expiration);
    }

    public String generateToken(UserDetails userDetails, String rol) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("rol", rol);
        return createToken(claims, userDetails.getUsername(), expiration);
    }

    public String generateRefreshToken(UserDetails userDetails, String rol) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("rol", rol);
        // jti único para que dos refresh tokens emitidos en el mismo segundo no coincidan
        return Jwts.builder()
                .claims(claims)
                .subject(userDetails.getUsername())
                .id(java.util.UUID.randomUUID().toString())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    private String createToken(Map<String, Object> claims, String subject, Long expirationMs) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    public Boolean isTokenValid(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
        } catch (Exception e) {
            return false;
        }
    }
}