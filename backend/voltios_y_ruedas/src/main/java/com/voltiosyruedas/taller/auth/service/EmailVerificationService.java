package com.voltiosyruedas.taller.auth.service;

import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.auth.repository.UsuarioRepository;
import com.voltiosyruedas.taller.common.exception.ApiException;
import com.voltiosyruedas.taller.notificaciones.service.MailService;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;

/**
 * Verificación de correo electrónico tras el registro. Genera un código de 6
 * dígitos (guardado en Redis por 30 minutos), lo envía por correo y permite
 * marcarlo como verificado al presentarlo.
 */
@Service
public class EmailVerificationService {

    private static final String PREFIX = "verif:";
    private static final Duration TTL = Duration.ofMinutes(30);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final RedisTemplate<String, String> redisTemplate;
    private final UsuarioRepository usuarioRepository;
    private final MailService mailService;

    public EmailVerificationService(
            RedisTemplate<String, String> redisTemplate,
            UsuarioRepository usuarioRepository,
            MailService mailService) {
        this.redisTemplate = redisTemplate;
        this.usuarioRepository = usuarioRepository;
        this.mailService = mailService;
    }

    private String generarCodigo() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    /** Genera, guarda y envía un código de verificación para el email dado. */
    public String generarYCodigo(String email) {
        String codigo = generarCodigo();
        redisTemplate.opsForValue().set(PREFIX + email, codigo, TTL);
        mailService.enviarCodigoVerificacion(email, codigo);
        return codigo;
    }

    /** Reenvía el código sin cambiar la cuenta (devuelve el código generado). */
    public String reenviarCodigo(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.notFound("Usuario no encontrado con email: " + email));
        if (Boolean.TRUE.equals(usuario.getEmailVerificado())) {
            throw ApiException.badRequest("El correo ya está verificado");
        }
        return generarYCodigo(email);
    }

    @Transactional
    public void verificar(String email, String codigo) {
        String guardado = redisTemplate.opsForValue().get(PREFIX + email);
        if (guardado == null || !guardado.equals(codigo.trim())) {
            throw ApiException.badRequest("Código de verificación inválido o expirado");
        }
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.notFound("Usuario no encontrado con email: " + email));
        usuario.setEmailVerificado(true);
        // La cuenta queda pendiente hasta confirmar el código; aquí se activa.
        usuario.setActivo(true);
        usuarioRepository.save(usuario);
        redisTemplate.delete(PREFIX + email);
    }
}