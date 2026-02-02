-- Enable pgcrypto extension for digest() function used in audit logs
CREATE EXTENSION IF NOT EXISTS pgcrypto;