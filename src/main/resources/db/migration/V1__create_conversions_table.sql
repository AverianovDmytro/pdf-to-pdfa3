-- Empty migration for now as we don't have entities yet, 
-- but Flyway needs to be configured correctly and we might need tables for logging conversions.
CREATE TABLE conversions (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_size BIGINT,
    converted_size BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
