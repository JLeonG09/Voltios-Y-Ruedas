-- V5: verificación de correo electrónico en el registro de usuarios
BEGIN;

ALTER TABLE usuarios ADD COLUMN email_verificado BOOLEAN NOT NULL DEFAULT TRUE;

COMMIT;