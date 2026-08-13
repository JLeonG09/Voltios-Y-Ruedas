package com.voltiosyruedas.taller.auth.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltiosyruedas.taller.auditoria.service.AuditService;
import com.voltiosyruedas.taller.auth.dto.ActualizarPerfilRequest;
import com.voltiosyruedas.taller.auth.dto.PreferenciasRequest;
import com.voltiosyruedas.taller.auth.dto.UsuarioResponse;
import com.voltiosyruedas.taller.common.exception.ApiException;
import com.voltiosyruedas.taller.auth.entity.Rol;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.auth.repository.RolRepository;
import com.voltiosyruedas.taller.auth.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final AuditService auditService;

    public Page<Usuario> listar(Pageable pageable, String search, Long rolId) {
        String termino = (search == null || search.isBlank()) ? null : search.trim();
        if (termino == null && rolId == null) {
            return usuarioRepository.findAll(pageable);
        }
        return usuarioRepository.filtrar(rolId, termino, pageable);
    }

    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }

    public Usuario obtenerPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Usuario no encontrado con ID: " + id));
    }

    public Usuario obtenerPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.notFound("Usuario no encontrado con email: " + email));
    }

    @Transactional
    public Usuario crear(Usuario usuario) {
        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            throw ApiException.conflict("El email ya está registrado");
        }
        // El rol llega como referencia {id}; se resuelve a la entidad gestionada.
        resolverRol(usuario);
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        if (usuario.getActivo() == null) {
            usuario.setActivo(true);
        }
        return usuarioRepository.save(usuario);
    }

    @Transactional
    public Usuario actualizar(Long id, Usuario usuarioActualizado) {
        Usuario usuario = obtenerPorId(id);
        usuario.setNombre(usuarioActualizado.getNombre());
        usuario.setApellido(usuarioActualizado.getApellido());
        usuario.setTelefono(usuarioActualizado.getTelefono());
        usuario.setDireccion(usuarioActualizado.getDireccion());
        // Si el campo no viene en el JSON no se toca (evita nulear activo).
        if (usuarioActualizado.getActivo() != null) {
            usuario.setActivo(usuarioActualizado.getActivo());
        }
        if (usuarioActualizado.getRol() != null) {
            resolverRol(usuarioActualizado);
            usuario.setRol(usuarioActualizado.getRol());
        }
        
        return usuarioRepository.save(usuario);
    }

    /** Resuelve el rol por id a una entidad gestionada (rechaza ids inexistentes). */
    private void resolverRol(Usuario usuario) {
        if (usuario.getRol() == null || usuario.getRol().getId() == null) {
            throw ApiException.badRequest("El rol es obligatorio");
        }
        Rol rol = rolRepository.findById(usuario.getRol().getId())
                .orElseThrow(() -> ApiException.badRequest("Rol no encontrado"));
        usuario.setRol(rol);
    }

    @Transactional
    public void cambiarPassword(Long id, String passwordActual, String passwordNuevo) {
        Usuario usuario = obtenerPorId(id);
        if (!passwordEncoder.matches(passwordActual, usuario.getPassword())) {
            throw ApiException.badRequest("La contraseña actual es incorrecta");
        }
        usuario.setPassword(passwordEncoder.encode(passwordNuevo));
        usuarioRepository.save(usuario);
        auditService.registrar("CAMBIO_PASSWORD", "USUARIO", id, "El usuario cambió su contraseña");
    }

    @Transactional
    public void eliminar(Long id) {
        Usuario usuario = obtenerPorId(id);
        usuarioRepository.deleteById(id);
        auditService.registrar("ELIMINAR_USUARIO", "USUARIO", id, "Eliminado el usuario " + usuario.getEmail());
    }

    public List<Usuario> obtenerMecanicos() {
        return usuarioRepository.findAll().stream()
                .filter(u -> u.getRol().getNombre().equals("MECANICO"))
                .toList();
    }

    @Transactional
    public Usuario actualizarPerfil(Long id, ActualizarPerfilRequest request) {
        Usuario usuario = obtenerPorId(id);
        usuario.setNombre(request.getNombre());
        usuario.setApellido(request.getApellido());
        usuario.setTelefono(request.getTelefono());
        usuario.setDireccion(request.getDireccion());
        Usuario guardado = usuarioRepository.save(usuario);
        auditService.registrar("ACTUALIZAR_PERFIL", "USUARIO", id, "El usuario actualizó su perfil");
        return guardado;
    }

    public PreferenciasRequest obtenerPreferencias(Long id) {
        Usuario usuario = obtenerPorId(id);
        if (usuario.getPreferencias() == null || usuario.getPreferencias().isBlank()) {
            return PreferenciasRequest.builder().build();
        }
        try {
            return objectMapper.readValue(usuario.getPreferencias(), PreferenciasRequest.class);
        } catch (JsonProcessingException e) {
            return PreferenciasRequest.builder().build();
        }
    }

    @Transactional
    public void guardarPreferencias(Long id, PreferenciasRequest preferencias) {
        Usuario usuario = obtenerPorId(id);
        try {
            usuario.setPreferencias(objectMapper.writeValueAsString(preferencias));
            usuarioRepository.save(usuario);
        } catch (JsonProcessingException e) {
            throw ApiException.badRequest("No se pudieron guardar las preferencias");
        }
    }

    public UsuarioResponse toResponse(Usuario usuario) {
        return UsuarioResponse.builder()
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .email(usuario.getEmail())
                .telefono(usuario.getTelefono())
                .direccion(usuario.getDireccion())
                .activo(usuario.getActivo())
                .emailVerificado(usuario.getEmailVerificado())
                .fechaCreacion(usuario.getFechaCreacion())
                .fechaActualizacion(usuario.getFechaActualizacion())
                .rol(usuario.getRol() != null ? UsuarioResponse.RolResponse.builder()
                        .id(usuario.getRol().getId())
                        .nombre(usuario.getRol().getNombre())
                        .descripcion(usuario.getRol().getDescripcion())
                        .build() : null)
                .build();
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con email: " + email));
    }
}