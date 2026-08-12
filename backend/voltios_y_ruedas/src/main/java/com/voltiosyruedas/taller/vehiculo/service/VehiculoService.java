package com.voltiosyruedas.taller.vehiculo.service;

import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.auth.service.UsuarioService;
import org.springframework.security.access.AccessDeniedException;
import com.voltiosyruedas.taller.vehiculo.dto.VehiculoRequest;
import com.voltiosyruedas.taller.vehiculo.dto.VehiculoResponse;
import com.voltiosyruedas.taller.vehiculo.entity.Vehiculo;
import com.voltiosyruedas.taller.vehiculo.repository.VehiculoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class VehiculoService {

    private static final Set<String> ROLES_STAFF = Set.of("ADMIN", "JEFE_TALLER", "MECANICO");

    private final VehiculoRepository vehiculoRepository;
    private final UsuarioService usuarioService;

    public Page<Vehiculo> listar(Pageable pageable) {
        return vehiculoRepository.findAll(pageable);
    }

    public List<Vehiculo> listarPorCliente(Usuario cliente) {
        return vehiculoRepository.findByCliente(cliente);
    }

    public Vehiculo obtenerPorId(Long id) {
        return vehiculoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehiculo no encontrado con ID: " + id));
    }

    public Vehiculo obtenerPorPlaca(String placa) {
        return vehiculoRepository.findByPlaca(placa)
                .orElseThrow(() -> new RuntimeException("Vehiculo no encontrado con placa: " + placa));
    }

    @Transactional
    public Vehiculo crearComoCliente(Usuario cliente, VehiculoRequest request) {
        if (vehiculoRepository.existsByPlaca(request.getPlaca())) {
            throw new RuntimeException("Ya existe un vehiculo registrado con esa placa");
        }
        Vehiculo vehiculo = mapearBase(request);
        vehiculo.setCliente(cliente);
        return vehiculoRepository.save(vehiculo);
    }

    @Transactional
    public Vehiculo crearComoStaff(VehiculoRequest request) {
        if (request.getClienteId() == null) {
            throw new RuntimeException("Debe especificar el cliente");
        }
        if (vehiculoRepository.existsByPlaca(request.getPlaca())) {
            throw new RuntimeException("Ya existe un vehiculo registrado con esa placa");
        }
        Usuario cliente = usuarioService.obtenerPorId(request.getClienteId());
        Vehiculo vehiculo = mapearBase(request);
        vehiculo.setCliente(cliente);
        return vehiculoRepository.save(vehiculo);
    }

    @Transactional
    public Vehiculo actualizar(Usuario solicitante, Long id, VehiculoRequest request) {
        Vehiculo vehiculo = obtenerPorId(id);
        validarAcceso(solicitante, vehiculo);

        if (!vehiculo.getPlaca().equalsIgnoreCase(request.getPlaca())
                && vehiculoRepository.existsByPlaca(request.getPlaca())) {
            throw new RuntimeException("Ya existe un vehiculo registrado con esa placa");
        }

        vehiculo.setPlaca(request.getPlaca());
        vehiculo.setMarca(request.getMarca());
        vehiculo.setModelo(request.getModelo());
        vehiculo.setAnio(request.getAnio());
        vehiculo.setColor(request.getColor());
        if (request.getKilometraje() != null) {
            vehiculo.setKilometraje(request.getKilometraje());
        }
        vehiculo.setNotas(request.getNotas());

        boolean esStaff = ROLES_STAFF.contains(solicitante.getRol().getNombre());
        if (esStaff && request.getEstado() != null && !request.getEstado().isBlank()) {
            vehiculo.setEstado(request.getEstado());
        } else if (esStaff && request.getClienteId() != null) {
            Usuario nuevoCliente = usuarioService.obtenerPorId(request.getClienteId());
            vehiculo.setCliente(nuevoCliente);
        }

        return vehiculoRepository.save(vehiculo);
    }

    @Transactional
    public Vehiculo cambiarEstado(Usuario solicitante, Long id, String nuevoEstado) {
        if (!ROLES_STAFF.contains(solicitante.getRol().getNombre())) {
            throw new AccessDeniedException("Solo el personal del taller puede cambiar el estado del vehiculo");
        }
        Vehiculo vehiculo = obtenerPorId(id);
        vehiculo.setEstado(nuevoEstado);
        return vehiculoRepository.save(vehiculo);
    }

    @Transactional
    public void eliminar(Usuario solicitante, Long id) {
        Vehiculo vehiculo = obtenerPorId(id);
        validarAcceso(solicitante, vehiculo);
        boolean esStaff = ROLES_STAFF.contains(solicitante.getRol().getNombre());
        if (!esStaff) {
            // Soft delete para clientes: pasan el vehiculo a un estado terminal
            vehiculo.setEstado("DISPONIBLE");
            vehiculoRepository.save(vehiculo);
            return;
        }
        vehiculoRepository.delete(vehiculo);
    }

    public VehiculoResponse mapearRespuesta(Vehiculo vehiculo) {
        String label;
        switch (vehiculo.getEstado()) {
            case "EN_TALLER": label = "En taller"; break;
            case "EN_REPARACION": label = "En reparacion"; break;
            case "LISTO": label = "Listo para entrega"; break;
            case "ENTREGADO": label = "Entregado"; break;
            default: label = "Disponible";
        }
        return VehiculoResponse.builder()
                .id(vehiculo.getId())
                .clienteId(vehiculo.getCliente() != null ? vehiculo.getCliente().getId() : null)
                .clienteNombre(vehiculo.getCliente() != null ? vehiculo.getCliente().getNombreCompleto() : null)
                .placa(vehiculo.getPlaca())
                .marca(vehiculo.getMarca())
                .modelo(vehiculo.getModelo())
                .anio(vehiculo.getAnio())
                .color(vehiculo.getColor())
                .kilometraje(vehiculo.getKilometraje())
                .estado(vehiculo.getEstado())
                .estadoLabel(label)
                .notas(vehiculo.getNotas())
                .fechaCreacion(vehiculo.getFechaCreacion())
                .fechaActualizacion(vehiculo.getFechaActualizacion())
                .build();
    }

    private Vehiculo mapearBase(VehiculoRequest request) {
        return Vehiculo.builder()
                .placa(request.getPlaca().toUpperCase())
                .marca(request.getMarca())
                .modelo(request.getModelo())
                .anio(request.getAnio())
                .color(request.getColor())
                .kilometraje(request.getKilometraje() != null ? request.getKilometraje() : 0)
                .estado(request.getEstado() != null && !request.getEstado().isBlank() ? request.getEstado() : "DISPONIBLE")
                .notas(request.getNotas())
                .build();
    }

    private void validarAcceso(Usuario solicitante, Vehiculo vehiculo) {
        boolean esStaff = ROLES_STAFF.contains(solicitante.getRol().getNombre());
        boolean esDueno = vehiculo.getCliente() != null
                && vehiculo.getCliente().getId().equals(solicitante.getId());
        if (!esStaff && !esDueno) {
            throw new AccessDeniedException("No tiene permisos sobre este vehiculo");
        }
    }
}
