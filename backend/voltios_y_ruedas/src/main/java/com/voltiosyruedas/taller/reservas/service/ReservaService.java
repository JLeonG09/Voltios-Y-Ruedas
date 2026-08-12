package com.voltiosyruedas.taller.reservas.service;

import com.voltiosyruedas.taller.auth.dto.UsuarioResponse;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.reservas.dto.ReservaRequest;
import com.voltiosyruedas.taller.reservas.dto.ReservaResponse;
import com.voltiosyruedas.taller.reservas.entity.Reserva;
import com.voltiosyruedas.taller.reservas.repository.ReservaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservaService {

    private final ReservaRepository reservaRepository;

    public Page<Reserva> listar(Pageable pageable, String search, String estado) {
        String termino = (search == null || search.isBlank()) ? null : search.trim();
        String estadoFiltro = (estado == null || estado.isBlank()) ? null : estado;
        if (termino == null && estadoFiltro == null) {
            return reservaRepository.findAll(pageable);
        }
        return reservaRepository.filtrar(estadoFiltro, termino, pageable);
    }

    public List<Reserva> listarPorCliente(Usuario cliente) {
        return reservaRepository.findByCliente(cliente);
    }

    public List<Reserva> listarPorFecha(LocalDateTime inicio, LocalDateTime fin) {
        return reservaRepository.findByFechaHoraBetween(inicio, fin);
    }

    public Reserva obtenerPorId(Long id) {
        return reservaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada con ID: " + id));
    }

    @Transactional
    public Reserva crear(Usuario cliente, ReservaRequest request) {
        Reserva reserva = Reserva.builder()
                .cliente(cliente)
                .fechaHora(request.getFechaHora())
                .descripcion(request.getDescripcion())
                .categoriaServicio(request.getCategoriaServicio())
                .estado("PENDIENTE")
                .build();

        return reservaRepository.save(reserva);
    }

    @Transactional
    public Reserva actualizar(Long id, ReservaRequest request) {
        Reserva reserva = obtenerPorId(id);
        reserva.setFechaHora(request.getFechaHora());
        reserva.setDescripcion(request.getDescripcion());
        reserva.setCategoriaServicio(request.getCategoriaServicio());
        return reservaRepository.save(reserva);
    }

    @Transactional
    public Reserva cambiarEstado(Long id, String estado) {
        Reserva reserva = obtenerPorId(id);
        reserva.setEstado(estado);
        return reservaRepository.save(reserva);
    }

    @Transactional
    public void cancelar(Long id) {
        Reserva reserva = obtenerPorId(id);
        reserva.setEstado("CANCELADA");
        reservaRepository.save(reserva);
    }

    @Transactional
    public void eliminar(Long id) {
        reservaRepository.deleteById(id);
    }

    /**
     * Mapea la entidad {@link Reserva} a su DTO de respuesta. Evita serializar
     * directamente la entidad, cuyo {@code cliente} es una proxy lazy de Hibernate
     * que rompe la serializacion JSON (ByteBuddyInterceptor).
     */
    public ReservaResponse toResponse(Reserva reserva) {
        return ReservaResponse.builder()
                .id(reserva.getId())
                .cliente(usuarioToResponse(reserva.getCliente()))
                .fechaHora(reserva.getFechaHora())
                .descripcion(reserva.getDescripcion())
                .categoriaServicio(reserva.getCategoriaServicio())
                .estado(reserva.getEstado())
                .fechaCreacion(reserva.getFechaCreacion())
                .fechaActualizacion(reserva.getFechaActualizacion())
                .build();
    }

    private UsuarioResponse usuarioToResponse(Usuario usuario) {
        if (usuario == null) return null;
        return UsuarioResponse.builder()
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .email(usuario.getEmail())
                .telefono(usuario.getTelefono())
                .direccion(usuario.getDireccion())
                .activo(usuario.getActivo())
                .fechaCreacion(usuario.getFechaCreacion())
                .fechaActualizacion(usuario.getFechaActualizacion())
                .rol(usuario.getRol() != null ? UsuarioResponse.RolResponse.builder()
                        .id(usuario.getRol().getId())
                        .nombre(usuario.getRol().getNombre())
                        .descripcion(usuario.getRol().getDescripcion())
                        .build() : null)
                .build();
    }
}