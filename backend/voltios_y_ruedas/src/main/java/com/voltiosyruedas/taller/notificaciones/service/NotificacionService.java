package com.voltiosyruedas.taller.notificaciones.service;

import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.auth.repository.UsuarioRepository;
import com.voltiosyruedas.taller.notificaciones.entity.Notificacion;
import com.voltiosyruedas.taller.notificaciones.repository.NotificacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificacionService {

    private static final List<String> ROLES_STAFF = List.of("ADMIN", "JEFE_TALLER", "MECANICO");

    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<Notificacion> listarPorUsuario(Long usuarioId) {
        return notificacionRepository.findByUsuarioIdOrderByFechaDesc(usuarioId);
    }

    @Transactional(readOnly = true)
    public long contarNoLeidas(Long usuarioId) {
        return notificacionRepository.countByUsuarioIdAndLeidaFalse(usuarioId);
    }

    @Transactional
    public Notificacion crear(Long usuarioId, String titulo, String mensaje, String tipo) {
        Usuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuario == null) {
            return null;
        }
        return notificacionRepository.save(Notificacion.builder()
                .usuario(usuario)
                .titulo(titulo)
                .mensaje(mensaje)
                .tipo(tipo != null ? tipo : "info")
                .build());
    }

    @Transactional
    public Notificacion marcarLeida(Long id, Long usuarioId) {
        Notificacion notificacion = notificacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notificación no encontrada con ID: " + id));
        if (!notificacion.getUsuario().getId().equals(usuarioId)) {
            throw new AccessDeniedException("No tiene permisos sobre esta notificación");
        }
        notificacion.setLeida(true);
        return notificacionRepository.save(notificacion);
    }

    @Transactional
    public void marcarTodasLeidas(Long usuarioId) {
        List<Notificacion> noLeidas = notificacionRepository.findByUsuarioIdAndLeidaFalse(usuarioId);
        noLeidas.forEach(n -> n.setLeida(true));
        notificacionRepository.saveAll(noLeidas);
    }

    /**
     * Crea una notificación para todo el personal (ADMIN, JEFE_TALLER, MECANICO).
     * Útil para avisar de nuevas reservas o stock bajo.
     */
    @Transactional
    public void notificarAStaff(String titulo, String mensaje, String tipo) {
        usuarioRepository.findAll().stream()
                .filter(u -> u.getRol() != null && ROLES_STAFF.contains(u.getRol().getNombre()))
                .filter(Usuario::getActivo)
                .forEach(u -> notificacionRepository.save(Notificacion.builder()
                        .usuario(u)
                        .titulo(titulo)
                        .mensaje(mensaje)
                        .tipo(tipo != null ? tipo : "info")
                        .build()));
    }
}
