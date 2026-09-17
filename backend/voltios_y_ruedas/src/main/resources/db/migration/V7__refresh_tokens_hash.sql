-- V7: persistir solo hash SHA-256 del refresh token (nunca el JWT en claro).
--
-- Invalidación: se borran tokens previos en texto plano; los clientes deben
-- volver a iniciar sesión. La columna mantiene el nombre "token" pero almacena
-- el hash hex (64 chars). UNIQUE e índices existentes se reutilizan.
BEGIN;

DELETE FROM refresh_tokens;

ALTER TABLE refresh_tokens ALTER COLUMN token TYPE VARCHAR(64);

COMMIT;
