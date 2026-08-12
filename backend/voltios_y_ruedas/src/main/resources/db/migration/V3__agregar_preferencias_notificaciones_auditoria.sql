-- V3: preferencias de usuario, notificaciones y auditoría de actividad
BEGIN;

-- Preferencias de configuración por usuario (tema, idioma, notificaciones, etc.)
ALTER TABLE usuarios ADD COLUMN preferencias VARCHAR(2000);

-- Tabla de notificaciones para el panel del usuario
CREATE TABLE notificaciones (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT,
    tipo VARCHAR(50) NOT NULL DEFAULT 'info',
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(usuario_id, leida);

-- Tabla de auditoría de actividad del sistema
CREATE TABLE auditoria (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT REFERENCES usuarios(id),
    usuario_email VARCHAR(150),
    accion VARCHAR(100) NOT NULL,
    entidad VARCHAR(100),
    entidad_id BIGINT,
    detalle TEXT,
    ip VARCHAR(64),
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_fecha ON auditoria(fecha);
CREATE INDEX idx_auditoria_accion ON auditoria(accion);

COMMIT;
