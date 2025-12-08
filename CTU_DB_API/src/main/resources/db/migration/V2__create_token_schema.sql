DROP TABLE IF EXISTS token;

CREATE TABLE token (
    id SERIAL PRIMARY KEY,
    user_id UUID,
    hashed_access_token TEXT NOT NULL,
    hashed_refresh_token TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
