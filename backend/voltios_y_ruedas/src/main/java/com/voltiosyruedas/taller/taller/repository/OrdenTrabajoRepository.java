package com.voltiosyruedas.taller.taller.repository;

import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.taller.entity.OrdenTrabajo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrdenTrabajoRepository extends JpaRepository<OrdenTrabajo, Long> {
    Optional<OrdenTrabajo> findByNumeroOrden(String numeroOrden);

    List<OrdenTrabajo> findByCliente(Usuario cliente);

    List<OrdenTrabajo> findByMecanico(Usuario mecanico);

    List<OrdenTrabajo> findByEstado(String estado);

    @Query("SELECT o FROM OrdenTrabajo o WHERE o.mecanico = :mecanico AND o.estado IN :estados")
    List<OrdenTrabajo> findByMecanicoAndEstados(@Param("mecanico") Usuario mecanico, @Param("estados") List<String> estados);
}