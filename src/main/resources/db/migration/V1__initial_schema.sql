CREATE TABLE conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_size BIGINT,
    converted_size BIGINT,
    status VARCHAR(50),
    error_message TEXT,
    processing_time_ms BIGINT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_date TIMESTAMP,
    version BIGINT DEFAULT 0
);
