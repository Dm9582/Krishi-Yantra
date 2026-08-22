PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    location TEXT,
    preferred_language TEXT DEFAULT 'en' CHECK(preferred_language IN ('en','hi')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('tractor','harvester','cultivator','seeder','irrigation','other')),
    description TEXT,
    location TEXT NOT NULL,
    price_per_day INTEGER NOT NULL CHECK(price_per_day > 0),
    image_url TEXT,
    availability_status TEXT DEFAULT 'available' CHECK(availability_status IN ('available','rented','maintenance')),
    rating REAL DEFAULT 4.5 CHECK(rating >= 0 AND rating <= 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipment_id INTEGER NOT NULL,
    renter_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    total_price INTEGER NOT NULL CHECK(total_price >= 0),
    status TEXT DEFAULT 'confirmed' CHECK(status IN ('pending','confirmed','completed','cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (renter_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK(date(end_date) >= date(start_date))
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipment_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(type);
CREATE INDEX IF NOT EXISTS idx_equipment_location ON equipment(location);
CREATE INDEX IF NOT EXISTS idx_equipment_owner ON equipment(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_equipment ON bookings(equipment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(equipment_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_renter ON bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_reviews_equipment ON reviews(equipment_id);
