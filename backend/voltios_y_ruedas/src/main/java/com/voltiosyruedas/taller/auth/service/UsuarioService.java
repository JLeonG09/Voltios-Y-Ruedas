package com.voltiosyruedas.taller.auth.service;

import com.voltiosyruedas.taller.auth.dto.UsuarioResponse;
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

    public Page<Usuario> listar(Pageable pageable) {
        return usuarioRepository.findAll(pageable);
    }

    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }

    public Usuario obtenerPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
    }

    public Usuario obtenerPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con email: " + email));
    }

    @Transactional
    public Usuario crear(Usuario usuario) {
        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            throw new RuntimeException("El email ya está registrado");
        }
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        return usuarioRepository.save(usuario);
    }

    @Transactional
    public Usuario actualizar(Long id, Usuario usuarioActualizado) {
        Usuario usuario = obtenerPorId(id);
        usuario.setNombre(usuarioActualizado.getNombre());
        usuario.setApellido(usuarioActualizado.getApellido());
        usuario.setTelefono(usuarioActualizado.getTelefono());
        usuario.setDireccion(usuarioActualizado.getDireccion());
        usuario.setActivo(usuarioActualizado.getActivo());
        
        if (usuarioActualizado.getRol() != null) {
            Rol rol = rolRepository.findById(usuarioActualizado.getRol().getId())
                    .orElseThrow(() -> new RuntimeException("Rol no encontrado"));
            usuario.setRol(rol);
        }
        
        return usuarioRepository.save(usuario);
    }

    @Transactional
    public void cambiarPassword(Long id, String passwordActual, String passwordNuevo) {
        Usuario usuario = obtenerPorId(id);
        if (!passwordEncoder.matches(passwordActual, usuario.getPassword())) {
            throw new RuntimeException("La contraseña actual es incorrecta");
        }
        usuario.setPassword(passwordEncoder.encode(passwordNuevo));
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void eliminar(Long id) {
        usuarioRepository.deleteById(id);
    }

    public List<Usuario> obtenerMecanicos() {
        return usuarioRepository.findAll().stream()
                .filter(u -> u.getRol().getNombre().equals("MECANICO"))
                .toList();
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con email: " + email));
    }
}