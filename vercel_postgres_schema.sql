-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  file_url TEXT NOT NULL,
  effective_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  notification_sent BOOLEAN DEFAULT FALSE
);
