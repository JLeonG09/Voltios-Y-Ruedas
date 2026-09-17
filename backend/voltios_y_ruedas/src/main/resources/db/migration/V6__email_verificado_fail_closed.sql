-- V6: email_verificado FAIL-CLOSED para altas nuevas.
--
-- Backfill / legacy:
--   V5 agregó la columna con DEFAULT TRUE. Las filas ya existentes (usuarios
--   pre-verificación o creados bajo ese default) se dejan SIN cambiar: se
--   asumen verificadas/legacy. NO se fuerza FALSE sobre datos históricos.
--   Solo se cambia el DEFAULT de la columna para que INSERT futuros sin valor
--   explícito queden no verificados (fail-closed). La entidad Java también
--   usa default false.
BEGIN;

ALTER TABLE usuarios ALTER COLUMN email_verificado SET DEFAULT FALSE;

COMMIT;
