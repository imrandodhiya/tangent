CREATE TABLE IF NOT EXISTS operator_lane_assignments (
  id            TEXT PRIMARY KEY,
  operator_id   TEXT NOT NULL,
  lane_id       TEXT NOT NULL,
  tournament_id TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Uniqueness to prevent duplicate assignments for the same operator/lane/tournament
CREATE UNIQUE INDEX IF NOT EXISTS operator_lane_assignments_unique
  ON operator_lane_assignments (operator_id, lane_id, tournament_id);

-- Foreign keys (assumes existing tables and ids are TEXT)
ALTER TABLE operator_lane_assignments
  ADD CONSTRAINT operator_lane_assignments_operator_fk
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE operator_lane_assignments
  ADD CONSTRAINT operator_lane_assignments_lane_fk
    FOREIGN KEY (lane_id) REFERENCES lanes(id) ON DELETE CASCADE;

ALTER TABLE operator_lane_assignments
  ADD CONSTRAINT operator_lane_assignments_tournament_fk
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

-- Trigger to auto-update updated_at on row updates (Postgres)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_timestamp') THEN
    CREATE OR REPLACE FUNCTION set_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_timestamp_operator_lane_assignments'
  ) THEN
    CREATE TRIGGER set_timestamp_operator_lane_assignments
    BEFORE UPDATE ON operator_lane_assignments
    FOR EACH ROW
    EXECUTE PROCEDURE set_timestamp();
  END IF;
END $$;
