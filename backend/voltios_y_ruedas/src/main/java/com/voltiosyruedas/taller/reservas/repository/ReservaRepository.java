package com.voltiosyruedas.taller.reservas.repository;

import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.reservas.entity.Reserva;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long> {
    List<Reserva> findByCliente(Usuario cliente);

    List<Reserva> findByFechaHoraBetween(LocalDateTime inicio, LocalDateTime fin);

    @Query("SELECT r FROM Reserva r WHERE r.cliente = :cliente AND r.fechaHora >= :fecha")
    List<Reserva> findByClienteAndFechaHoraAfter(@Param("cliente") Usuario cliente, @Param("fecha") LocalDateTime fecha);

    @Query("SELECT r FROM Reserva r WHERE " +
            "(:estado IS NULL OR r.estado = :estado) AND " +
            "(:search IS NULL OR LOWER(r.cliente.nombre) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(r.cliente.apellido) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(r.cliente.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(r.categoriaServicio) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(r.descripcion) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Reserva> filtrar(@Param("estado") String estado, @Param("search") String search, Pageable pageable);
}