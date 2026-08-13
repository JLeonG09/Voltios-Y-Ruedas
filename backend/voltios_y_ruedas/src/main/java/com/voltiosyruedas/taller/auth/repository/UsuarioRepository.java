package com.voltiosyruedas.taller.auth.repository;

import com.voltiosyruedas.taller.auth.entity.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM Usuario u WHERE " +
            "(:rolId IS NULL OR u.rol.id = :rolId) AND " +
            "(:search IS NULL OR LOWER(u.nombre) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
            "OR LOWER(u.apellido) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
            "OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
            "OR LOWER(u.telefono) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<Usuario> filtrar(@Param("rolId") Long rolId, @Param("search") String search, Pageable pageable);
}