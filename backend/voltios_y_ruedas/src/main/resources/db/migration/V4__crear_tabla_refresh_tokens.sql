-- V4: almacenamiento de refresh tokens para rotación y detección de reuso
BEGIN;

CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
    token VARCHAR(500) NOT NULL UNIQUE,
    expiracion TIMESTAMP NOT NULL,
    revocado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_usuario ON refresh_tokens(usuario_id);
CREATE INDEX idx_refresh_tokens_revocado ON refresh_tokens(usuario_id, revocado);

COMMIT;
