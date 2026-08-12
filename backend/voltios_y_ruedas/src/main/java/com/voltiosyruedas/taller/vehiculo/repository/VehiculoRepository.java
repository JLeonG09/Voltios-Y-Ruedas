package com.voltiosyruedas.taller.vehiculo.repository;

import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.vehiculo.entity.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehiculoRepository extends JpaRepository<Vehiculo, Long> {
    Optional<Vehiculo> findByPlaca(String placa);

    List<Vehiculo> findByCliente(Usuario cliente);

    List<Vehiculo> findByClienteId(Long clienteId);

    boolean existsByPlaca(String placa);
}
