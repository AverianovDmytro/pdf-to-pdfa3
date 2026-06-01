ALTER TABLE conversions ADD COLUMN status VARCHAR(50);
ALTER TABLE conversions ADD COLUMN error_message TEXT;
ALTER TABLE conversions ADD COLUMN processing_time_ms BIGINT;
