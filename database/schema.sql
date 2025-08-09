-- Database schema for Door Store App
-- This file defines the structure of the SQLite database

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);

-- Insert some sample data for testing (optional)
-- You can comment these out if you don't want sample data
-- INSERT
--     OR IGNORE INTO products (id, name, price, stock)
-- VALUES (1, 'Wooden Door', 15000.00, 5),
--     (2, 'Glass Door', 25000.00, 3),
--     (3, 'Metal Door', 18000.00, 7);