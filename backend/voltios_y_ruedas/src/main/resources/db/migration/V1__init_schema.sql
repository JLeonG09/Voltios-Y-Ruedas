-- Migración inicial del esquema de base de datos para Voltios y Ruedas
-- V1__init_schema.sql

-- Tabla de roles
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

-- Tabla de usuarios
CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rol_id BIGINT NOT NULL REFERENCES roles(id)
);

-- Tabla de reservas (citas)
CREATE TABLE reservas (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES usuarios(id),
    fecha_hora TIMESTAMP NOT NULL,
    descripcion TEXT,
    categoria_servicio VARCHAR(100),
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de órdenes de trabajo
CREATE TABLE ordenes_trabajo (
    id BIGSERIAL PRIMARY KEY,
    reserva_id BIGINT UNIQUE REFERENCES reservas(id),
    cliente_id BIGINT NOT NULL REFERENCES usuarios(id),
    mecanico_id BIGINT REFERENCES usuarios(id),
    numero_orden VARCHAR(50) NOT NULL UNIQUE,
    descripcion_problema TEXT NOT NULL,
    diagnostico TEXT,
    solucion_aplicada TEXT,
    estado VARCHAR(50) NOT NULL DEFAULT 'RECIEN_INGRESADO',
    fecha_ingreso TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_estimada_entrega TIMESTAMP,
    fecha_entrega_real TIMESTAMP,
    costo_mano_obra DECIMAL(10, 2) DEFAULT 0.00,
    costo_repuestos DECIMAL(10, 2) DEFAULT 0.00,
    costo_total DECIMAL(10, 2) DEFAULT 0.00,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_estado_orden CHECK (estado IN (
        'RECIEN_INGRESADO',
        'POR_INGRESAR',
        'TRABAJANDO',
        'TERMINADO',
        'ENTREGADO'
    ))
);

-- Tabla de bitácoras (historial de cambios en órdenes de trabajo)
CREATE TABLE bitacoras (
    id BIGSERIAL PRIMARY KEY,
    orden_trabajo_id BIGINT NOT NULL REFERENCES ordenes_trabajo(id),
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
    accion VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de inventario (repuestos)
CREATE TABLE inventario (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100),
    marca VARCHAR(100),
    modelo VARCHAR(100),
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    precio_compra DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    precio_venta DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ubicacion VARCHAR(100),
    proveedor VARCHAR(150),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación entre órdenes de trabajo e inventario (repuestos utilizados)
CREATE TABLE ordenes_trabajo_inventario (
    id BIGSERIAL PRIMARY KEY,
    orden_trabajo_id BIGINT NOT NULL REFERENCES ordenes_trabajo(id),
    inventario_id BIGINT NOT NULL REFERENCES inventario(id),
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_orden_inventario UNIQUE (orden_trabajo_id, inventario_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol_id);
CREATE INDEX idx_reservas_cliente ON reservas(cliente_id);
CREATE INDEX idx_reservas_fecha ON reservas(fecha_hora);
CREATE INDEX idx_ordenes_trabajo_cliente ON ordenes_trabajo(cliente_id);
CREATE INDEX idx_ordenes_trabajo_mecanico ON ordenes_trabajo(mecanico_id);
CREATE INDEX idx_ordenes_trabajo_estado ON ordenes_trabajo(estado);
CREATE INDEX idx_ordenes_trabajo_numero ON ordenes_trabajo(numero_orden);
CREATE INDEX idx_bitacoras_orden ON bitacoras(orden_trabajo_id);
CREATE INDEX idx_inventario_codigo ON inventario(codigo);
CREATE INDEX idx_inventario_categoria ON inventario(categoria);
CREATE INDEX idx_ordenes_trabajo_inventario_orden ON ordenes_trabajo_inventario(orden_trabajo_id);
CREATE INDEX idx_ordenes_trabajo_inventario_inventario ON ordenes_trabajo_inventario(inventario_id);

-- Datos iniciales para roles
INSERT INTO roles (nombre, descripcion) VALUES
('ADMIN', 'Administrador del sistema con acceso completo'),
('JEFE_TALLER', 'Jefe de taller con permisos de gestión de órdenes y mecánicos'),
('MECANICO', 'Mecánico que ejecuta las órdenes de trabajo'),
('CLIENTE', 'Cliente que solicita servicios y reservas');