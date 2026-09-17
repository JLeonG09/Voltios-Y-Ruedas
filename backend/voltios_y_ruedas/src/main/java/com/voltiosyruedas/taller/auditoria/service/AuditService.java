package com.voltiosyruedas.taller.auditoria.service;

import com.voltiosyruedas.taller.auditoria.dto.AuditoriaResponse;
import com.voltiosyruedas.taller.auditoria.entity.AuditoriaLog;
import com.voltiosyruedas.taller.auditoria.repository.AuditoriaRepository;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
@RequiredArgsConstructor
public class AuditService {

    private static final Logger logger = LoggerFactory.getLogger(AuditService.class);

    private final AuditoriaRepository auditoriaRepository;

    @Value("${app.security.trust-forwarded-headers:false}")
    private boolean trustForwardedHeaders;

    @Transactional(readOnly = true)
    public Page<AuditoriaLog> listar(Pageable pageable) {
        return auditoriaRepository.findAll(pageable);
    }

    public AuditoriaResponse toResponse(AuditoriaLog log) {
        return AuditoriaResponse.builder()
                .id(log.getId())
                .usuarioId(log.getUsuarioId())
                .usuarioEmail(log.getUsuarioEmail())
                .accion(log.getAccion())
                .entidad(log.getEntidad())
                .entidadId(log.getEntidadId())
                .detalle(log.getDetalle())
                .ip(log.getIp())
                .fecha(log.getFecha())
                .build();
    }

    @Transactional
    public void registrar(String accion, String entidad, Long entidadId, String detalle) {
        try {
            Usuario usuario = null;
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof Usuario u) {
                usuario = u;
            }

            AuditoriaLog log = AuditoriaLog.builder()
                    .usuarioId(usuario != null ? usuario.getId() : null)
                    .usuarioEmail(usuario != null ? usuario.getEmail() : null)
                    .accion(accion)
                    .entidad(entidad)
                    .entidadId(entidadId)
                    .detalle(detalle)
                    .ip(obtenerIp())
                    .build();

            auditoriaRepository.save(log);
        } catch (Exception e) {
            logger.warn("No se pudo registrar la auditoría para la acción {}", accion);
        }
    }

    private String obtenerIp() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                if (trustForwardedHeaders) {
                    String xff = request.getHeader("X-Forwarded-For");
                    if (xff != null && !xff.isBlank()) {
                        return xff.split(",")[0].trim();
                    }
                }
                return request.getRemoteAddr();
            }
        } catch (Exception e) {
            logger.warn("No se pudo obtener la IP del request");
        }
        return null;
    }
}
