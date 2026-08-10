package com.voltiosyruedas.taller.inventario.repository;

import com.voltiosyruedas.taller.inventario.entity.Inventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventarioRepository extends JpaRepository<Inventario, Long> {
    Optional<Inventario> findByCodigo(String codigo);

    List<Inventario> findByCategoria(String categoria);

    List<Inventario> findByActivoTrue();

    @Query("SELECT i FROM Inventario i WHERE i.stockActual <= i.stockMinimo AND i.activo = true")
    List<Inventario> findByStockActualLessThanEqualStockMinimo();
}