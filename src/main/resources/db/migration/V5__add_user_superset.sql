DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'superset') THEN
        CREATE USER superset WITH PASSWORD 'superset01';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE postgres TO superset;
-- Grant usage on the public schema
GRANT USAGE ON SCHEMA public TO superset;

-- Grant select rights on all current tables in the public schema
GRANT SELECT ON ALL TABLES IN SCHEMA public TO superset;

-- Grant select rights on all current sequences (optional, but often needed for analysis)
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO superset;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO superset;
