-- Tabla de vehiculos asociados a clientes
CREATE TABLE vehiculos (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES usuarios(id),
    placa VARCHAR(20) NOT NULL UNIQUE,
    marca VARCHAR(80) NOT NULL,
    modelo VARCHAR(80) NOT NULL,
    anio INT,
    color VARCHAR(40),
    kilometraje INT NOT NULL DEFAULT 0,
    estado VARCHAR(50) NOT NULL DEFAULT 'DISPONIBLE',
    notas TEXT,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_estado_vehiculo CHECK (estado IN (
        'DISPONIBLE',
        'EN_TALLER',
        'EN_REPARACION',
        'LISTO',
        'ENTREGADO'
    ))
);

CREATE INDEX idx_vehiculos_cliente ON vehiculos(cliente_id);
CREATE INDEX idx_vehiculos_placa ON vehiculos(placa);
CREATE INDEX idx_vehiculos_estado ON vehiculos(estado);

COMMENT ON TABLE vehiculos IS 'Vehiculos registrados por los clientes';
COMMENT ON COLUMN vehiculos.estado IS 'Estados: DISPONIBLE, EN_TALLER, EN_REPARACION, LISTO, ENTREGADO';