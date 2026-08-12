package com.voltiosyruedas.taller.auditoria.repository;

import com.voltiosyruedas.taller.auditoria.entity.AuditoriaLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditoriaRepository extends JpaRepository<AuditoriaLog, Long> {
}
