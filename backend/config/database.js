const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../../database/krishi.db');
const schemaPath = path.join(__dirname, '../../database/schema.sql');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to SQLite database at', dbPath);
        db.run('PRAGMA foreign_keys = ON');
    }
});

function runAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
}
function getAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}
function allAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function initDB() {
    try {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        // Split and run statements
        await new Promise((resolve, reject) => {
            db.exec(schema, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log('Schema initialized');

        // Check if already seeded
        const userCount = await getAsync('SELECT COUNT(*) as count FROM users');
        if (userCount && userCount.count === 0) {
            console.log('Seeding database...');
            const hash = bcrypt.hashSync('password123', 10);
            const users = [
                ['Ramesh Kumar', '9876543210', 'ramesh@example.com', hash, 'Sehore, Madhya Pradesh', 'hi'],
                ['Priya Singh', '9876543211', 'priya@example.com', hash, 'Ludhiana, Punjab', 'en'],
                ['Arjun Patel', '9876543212', 'arjun@example.com', hash, 'Nashik, Maharashtra', 'en']
            ];
            for (const u of users) {
                await runAsync('INSERT INTO users (name, phone, email, password_hash, location, preferred_language) VALUES (?,?,?,?,?,?)', u);
            }
            console.log('Users seeded');

            const equipment = [
                [1, 'Mahindra 575 DI Tractor', 'tractor', 'Powerful 45 HP tractor ideal for ploughing and hauling. Well maintained, fuel efficient.', 'Sehore, Madhya Pradesh', 2500, 'https://images.unsplash.com/photo-1592985684811-6c0f98adb014?w=400', 'available', 4.8],
                [2, 'John Deere 5039 Tractor', 'tractor', '39 HP tractor with advanced hydraulics, suitable for all farming operations.', 'Ludhiana, Punjab', 3000, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400', 'available', 4.7],
                [1, 'Sonalika DI 35 Tractor', 'tractor', 'Compact 35 HP tractor perfect for small farms and orchards.', 'Nashik, Maharashtra', 1800, 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400', 'available', 4.5],
                [2, 'Claas Crop Tiger Harvester', 'harvester', 'High efficiency harvester for wheat and paddy. Cuts and threshes in one go.', 'Karnal, Haryana', 5500, 'https://images.unsplash.com/photo-1500930540495-e92875696a16?w=400', 'available', 4.9],
                [3, 'Preet 987 Harvester', 'harvester', 'Self-propelled combine harvester, 5.5 feet cutter bar, excellent grain quality.', 'Bathinda, Punjab', 5000, 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400', 'available', 4.6],
                [1, 'Shaktiman Cultivator', 'cultivator', '9-tine cultivator for soil preparation and weed control.', 'Sehore, Madhya Pradesh', 1200, 'https://images.unsplash.com/photo-1592985684811-6c0f98adb014?w=400', 'available', 4.4],
                [2, 'Fieldking Cultivator', 'cultivator', 'Spring loaded cultivator, durable and efficient.', 'Indore, Madhya Pradesh', 1000, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400', 'available', 4.3],
                [3, 'National Seeder Machine', 'seeder', 'Zero-till seed drill for wheat sowing, saves time and water.', 'Jaipur, Rajasthan', 1500, 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400', 'available', 4.5],
                [1, 'Khedut Seeder', 'seeder', 'Precision seeder for cotton and maize, uniform seed spacing.', 'Anand, Gujarat', 1300, 'https://images.unsplash.com/photo-1592985684811-6c0f98adb014?w=400', 'available', 4.2],
                [2, 'Kirloskar Irrigation Pump', 'irrigation', '5 HP diesel pump for irrigation, high discharge.', 'Nagpur, Maharashtra', 800, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400', 'available', 4.6],
                [3, 'Jain Drip Irrigation System', 'irrigation', 'Complete drip system for 1 acre, water saving up to 50%.', 'Pune, Maharashtra', 900, 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400', 'available', 4.7]
            ];
            for (const e of equipment) {
                await runAsync('INSERT INTO equipment (owner_id, name, type, description, location, price_per_day, image_url, availability_status, rating) VALUES (?,?,?,?,?,?,?,?,?)', e);
            }
            console.log('Equipment seeded (11 items)');

            // Sample booking: Tractor #1 booked 2026-08-10 to 2026-08-15
            await runAsync('INSERT INTO bookings (equipment_id, renter_id, start_date, end_date, total_price, status) VALUES (?,?,?,?,?,?)', [1, 2, '2026-08-10', '2026-08-15', 15000, 'confirmed']);
            await runAsync('INSERT INTO bookings (equipment_id, renter_id, start_date, end_date, total_price, status) VALUES (?,?,?,?,?,?)', [4, 3, '2026-08-20', '2026-08-22', 16500, 'confirmed']);
            console.log('Sample bookings seeded');

            // Sample reviews
            await runAsync('INSERT INTO reviews (equipment_id, user_id, rating, comment) VALUES (?,?,?,?)', [1, 2, 5, 'Excellent tractor, well maintained!']);
            await runAsync('INSERT INTO reviews (equipment_id, user_id, rating, comment) VALUES (?,?,?,?)', [4, 1, 4, 'Harvester worked great for my wheat field.']);
            console.log('Reviews seeded');
        } else {
            console.log('Database already seeded, users:', userCount.count);
        }
    } catch (err) {
        console.error('DB init error:', err);
    }
}

// Initialize immediately
initDB();

module.exports = { db, runAsync, getAsync, allAsync, initDB };
