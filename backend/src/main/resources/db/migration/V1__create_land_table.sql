CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE land (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  price        NUMERIC(15, 2)        NOT NULL,
  description  TEXT                  NOT NULL,
  contact      VARCHAR(255)          NOT NULL,
  geometry     geometry(Polygon, 4326) NOT NULL,
  created_at   TIMESTAMPTZ           NOT NULL DEFAULT now(),

  CONSTRAINT chk_land_price_positive CHECK (price > 0),
  CONSTRAINT chk_land_geometry_valid CHECK (ST_IsValid(geometry))
);

CREATE INDEX idx_land_geometry ON land USING GIST (geometry);