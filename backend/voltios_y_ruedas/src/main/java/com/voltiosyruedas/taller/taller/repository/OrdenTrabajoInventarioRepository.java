package com.voltiosyruedas.taller.taller.repository;

import com.voltiosyruedas.taller.taller.entity.OrdenTrabajo;
import com.voltiosyruedas.taller.taller.entity.OrdenTrabajoInventario;
import com.voltiosyruedas.taller.inventario.entity.Inventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrdenTrabajoInventarioRepository extends JpaRepository<OrdenTrabajoInventario, Long> {
    List<OrdenTrabajoInventario> findByOrdenTrabajo(OrdenTrabajo ordenTrabajo);

    Optional<OrdenTrabajoInventario> findByOrdenTrabajoAndInventario(OrdenTrabajo ordenTrabajo, Inventario inventario);
}