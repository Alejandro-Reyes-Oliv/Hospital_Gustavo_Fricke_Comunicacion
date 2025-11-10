

SELECT data_type
FROM information_schema.columns
WHERE table_name = 'Cita' AND column_name = 'fecha_hora';

SHOW TIME ZONE;

ALTER TABLE "Cita"
  ALTER COLUMN "fecha_hora" TYPE timestamptz(6)
  USING ("fecha_hora"::timestamp AT TIME ZONE 'America/Santiago');

  SELECT '2025-10-24 17:00'::timestamp AT TIME ZONE 'America/Santiago';

  ALTER ROLE postgres SET TIME ZONE 'America/Santiago';