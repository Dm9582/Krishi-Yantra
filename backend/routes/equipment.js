const express = require('express');
const { getAsync, allAsync, runAsync } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// GET /api/equipment - with filters search, type, location, price, availability, sort
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { search, type, location, minPrice, maxPrice, availability, sort, owner_id } = req.query;
        let sql = `SELECT e.*, u.name as owner_name, u.phone as owner_phone FROM equipment e JOIN users u ON e.owner_id = u.id WHERE 1=1`;
        const params = [];
        if (search) {
            sql += ` AND (e.name LIKE ? OR e.description LIKE ? OR e.location LIKE ?)`;
            const like = `%${search}%`;
            params.push(like, like, like);
        }
        if (type && type !== 'all') {
            sql += ` AND e.type = ?`;
            params.push(type);
        }
        if (location) {
            sql += ` AND e.location LIKE ?`;
            params.push(`%${location}%`);
        }
        if (minPrice) {
            sql += ` AND e.price_per_day >= ?`;
            params.push(parseInt(minPrice));
        }
        if (maxPrice) {
            sql += ` AND e.price_per_day <= ?`;
            params.push(parseInt(maxPrice));
        }
        if (availability) {
            sql += ` AND e.availability_status = ?`;
            params.push(availability);
        }
        if (owner_id) {
            sql += ` AND e.owner_id = ?`;
            params.push(owner_id);
        }
        if (sort === 'price_asc') sql += ` ORDER BY e.price_per_day ASC`;
        else if (sort === 'price_desc') sql += ` ORDER BY e.price_per_day DESC`;
        else if (sort === 'rating') sql += ` ORDER BY e.rating DESC`;
        else sql += ` ORDER BY e.created_at DESC`;

        const rows = await allAsync(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('Equipment list error', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/equipment/:id
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid equipment ID' });
        const equipment = await getAsync(`SELECT e.*, u.name as owner_name, u.phone as owner_phone, u.location as owner_location FROM equipment e JOIN users u ON e.owner_id = u.id WHERE e.id = ?`, [id]);
        if (!equipment) return res.status(404).json({ error: 'Equipment not found' });

        // Get bookings for this equipment to show unavailable dates
        const bookings = await allAsync(`SELECT start_date, end_date, status FROM bookings WHERE equipment_id = ? AND status IN ('confirmed','pending') ORDER BY start_date`, [id]);
        // Get reviews
        const reviews = await allAsync(`SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.equipment_id = ? ORDER BY r.created_at DESC LIMIT 10`, [id]);
        res.json({ ...equipment, bookings, reviews });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/equipment - create (auth required)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, type, description, location, price_per_day, image_url, availability_status } = req.body;
        if (!name || !type || !location || !price_per_day) {
            return res.status(400).json({ error: 'name, type, location, price_per_day are required' });
        }
        const validTypes = ['tractor','harvester','cultivator','seeder','irrigation','other'];
        if (!validTypes.includes(type)) return res.status(400).json({ error: 'Invalid type' });
        const price = parseInt(price_per_day);
        if (isNaN(price) || price <= 0) return res.status(400).json({ error: 'Invalid price' });

        const result = await runAsync(
            `INSERT INTO equipment (owner_id, name, type, description, location, price_per_day, image_url, availability_status) VALUES (?,?,?,?,?,?,?,?)`,
            [req.user.id, name, type, description || '', location, price, image_url || 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(name), availability_status || 'available']
        );
        const created = await getAsync(`SELECT e.*, u.name as owner_name FROM equipment e JOIN users u ON e.owner_id = u.id WHERE e.id = ?`, [result.id]);
        res.status(201).json(created);
    } catch (err) {
        console.error('Create equipment error', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/equipment/:id - update only owner
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const existing = await getAsync(`SELECT * FROM equipment WHERE id = ?`, [id]);
        if (!existing) return res.status(404).json({ error: 'Equipment not found' });
        if (existing.owner_id !== req.user.id) return res.status(403).json({ error: 'Not authorized to update this equipment' });

        const { name, type, description, location, price_per_day, image_url, availability_status } = req.body;
        // Build dynamic update but use parameterized
        await runAsync(
            `UPDATE equipment SET name = COALESCE(?, name), type = COALESCE(?, type), description = COALESCE(?, description), location = COALESCE(?, location), price_per_day = COALESCE(?, price_per_day), image_url = COALESCE(?, image_url), availability_status = COALESCE(?, availability_status) WHERE id = ?`,
            [name || null, type || null, description || null, location || null, price_per_day ? parseInt(price_per_day) : null, image_url || null, availability_status || null, id]
        );
        const updated = await getAsync(`SELECT e.*, u.name as owner_name FROM equipment e JOIN users u ON e.owner_id = u.id WHERE e.id = ?`, [id]);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/equipment/:id - only owner
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const existing = await getAsync(`SELECT * FROM equipment WHERE id = ?`, [id]);
        if (!existing) return res.status(404).json({ error: 'Equipment not found' });
        if (existing.owner_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

        // Check active bookings
        const active = await getAsync(`SELECT COUNT(*) as count FROM bookings WHERE equipment_id = ? AND status IN ('confirmed','pending') AND date(end_date) >= date('now')`, [id]);
        if (active && active.count > 0) return res.status(400).json({ error: 'Cannot delete equipment with active bookings' });

        await runAsync(`DELETE FROM equipment WHERE id = ?`, [id]);
        res.json({ message: 'Equipment deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/equipment/:id/availability?start=2026-08-12&end=2026-08-18 - check availability
router.get('/:id/availability', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { start, end } = req.query;
        if (!start || !end) return res.status(400).json({ error: 'start and end dates required' });
        // Overlap check: NOT (newEnd < existingStart OR newStart > existingEnd) => overlap
        const overlap = await getAsync(
            `SELECT COUNT(*) as count FROM bookings WHERE equipment_id = ? AND status IN ('confirmed','pending') AND NOT (date(?) < date(start_date) OR date(?) > date(end_date)) AND NOT (date(?) > date(end_date) OR date(?) < date(start_date))`,
            [id, end, start, start, end]
        );
        // Simpler overlap logic: newStart <= existingEnd AND newEnd >= existingStart
        const overlap2 = await getAsync(
            `SELECT COUNT(*) as count FROM bookings WHERE equipment_id = ? AND status IN ('confirmed','pending') AND date(?) <= date(end_date) AND date(?) >= date(start_date)`,
            [id, start, end]
        );
        const isAvailable = overlap2.count === 0;
        res.json({ available: isAvailable, overlappingBookings: overlap2.count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
