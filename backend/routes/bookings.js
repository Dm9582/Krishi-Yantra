const express = require('express');
const { getAsync, allAsync, runAsync } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Helper to calculate days inclusive? spec says total = days * pricePerDay. Use ceil diff days.
function calculateDays(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = e - s;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
    // If same day, diffDays =1
    if (isNaN(diffDays) || diffDays < 1) return 1;
    return diffDays;
}

// POST /api/bookings - create booking with double-booking prevention
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { equipment_id, start_date, end_date } = req.body;
        if (!equipment_id || !start_date || !end_date) {
            return res.status(400).json({ error: 'equipment_id, start_date, end_date required' });
        }
        const eqId = parseInt(equipment_id);
        if (isNaN(eqId)) return res.status(400).json({ error: 'Invalid equipment_id' });

        const start = new Date(start_date);
        const end = new Date(end_date);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return res.status(400).json({ error: 'Invalid date format, use YYYY-MM-DD' });
        if (end < start) return res.status(400).json({ error: 'End date must be after start date' });
        // Disallow past dates (optional)
        const today = new Date(); today.setHours(0,0,0,0);
        if (start < today) {
            // Allow today onwards, but warn if past - we will allow for testing purposes if date is before today? Let's allow but log
            // return res.status(400).json({ error: 'Start date cannot be in the past' });
        }

        const equipment = await getAsync('SELECT * FROM equipment WHERE id = ?', [eqId]);
        if (!equipment) return res.status(404).json({ error: 'Equipment not found' });
        if (equipment.owner_id === req.user.id) return res.status(400).json({ error: 'Cannot book your own equipment' });
        if (equipment.availability_status !== 'available') return res.status(400).json({ error: 'Equipment not available' });

        // CRITICAL: Double-booking prevention - check overlapping bookings
        // Overlap condition: newStart <= existingEnd AND newEnd >= existingStart
        const overlap = await getAsync(
            `SELECT id, start_date, end_date FROM bookings WHERE equipment_id = ? AND status IN ('confirmed','pending') AND date(?) <= date(end_date) AND date(?) >= date(start_date) LIMIT 1`,
            [eqId, start_date, end_date]
        );
        if (overlap) {
            return res.status(409).json({
                error: 'Equipment already booked for overlapping dates',
                overlappingBooking: overlap,
                message: `Already booked from ${overlap.start_date} to ${overlap.end_date}. Please choose different dates.`
            });
        }

        const days = calculateDays(start_date, end_date);
        const total_price = days * equipment.price_per_day;

        const result = await runAsync(
            `INSERT INTO bookings (equipment_id, renter_id, start_date, end_date, total_price, status) VALUES (?,?,?,?,?,?)`,
            [eqId, req.user.id, start_date, end_date, total_price, 'confirmed']
        );
        const booking = await getAsync(
            `SELECT b.*, e.name as equipment_name, e.type as equipment_type, e.price_per_day, e.location, u.name as renter_name FROM bookings b JOIN equipment e ON b.equipment_id = e.id JOIN users u ON b.renter_id = u.id WHERE b.id = ?`,
            [result.id]
        );
        res.status(201).json({ message: 'Booking confirmed', booking, days, total_price });
    } catch (err) {
        console.error('Booking create error', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/bookings - get user bookings (renter) and owner bookings? query type
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { type } = req.query; // type=owner or renter or all
        let sql = ``;
        let params = [];
        if (type === 'owner') {
            sql = `SELECT b.*, e.name as equipment_name, e.type as equipment_type, e.image_url, e.location, u.name as renter_name, u.phone as renter_phone
                   FROM bookings b JOIN equipment e ON b.equipment_id = e.id JOIN users u ON b.renter_id = u.id WHERE e.owner_id = ? ORDER BY b.start_date DESC`;
            params = [req.user.id];
        } else if (type === 'renter') {
            sql = `SELECT b.*, e.name as equipment_name, e.type as equipment_type, e.image_url, e.location, e.price_per_day, u.name as owner_name
                   FROM bookings b JOIN equipment e ON b.equipment_id = e.id JOIN users u ON e.owner_id = u.id WHERE b.renter_id = ? ORDER BY b.start_date DESC`;
            params = [req.user.id];
        } else {
            // All: union both where user is renter or owner
            sql = `SELECT b.*, e.name as equipment_name, e.type as equipment_type, e.image_url, e.location, e.owner_id, u.name as renter_name
                   FROM bookings b JOIN equipment e ON b.equipment_id = e.id JOIN users u ON b.renter_id = u.id WHERE b.renter_id = ? OR e.owner_id = ? ORDER BY b.start_date DESC`;
            params = [req.user.id, req.user.id];
        }
        const rows = await allAsync(sql, params);
        // Add days calculation
        const enriched = rows.map(r => ({
            ...r,
            days: calculateDays(r.start_date, r.end_date)
        }));
        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/bookings/:id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const booking = await getAsync(
            `SELECT b.*, e.name as equipment_name, e.type as equipment_type, e.price_per_day, e.location, e.owner_id, e.image_url FROM bookings b JOIN equipment e ON b.equipment_id = e.id WHERE b.id = ?`,
            [id]
        );
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.renter_id !== req.user.id && booking.owner_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
        booking.days = calculateDays(booking.start_date, booking.end_date);
        res.json(booking);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/bookings/:id - update status (cancel, complete)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;
        const valid = ['pending','confirmed','completed','cancelled'];
        if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

        const booking = await getAsync(`SELECT b.*, e.owner_id FROM bookings b JOIN equipment e ON b.equipment_id = e.id WHERE b.id = ?`, [id]);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.renter_id !== req.user.id && booking.owner_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

        await runAsync(`UPDATE bookings SET status = ? WHERE id = ?`, [status, id]);
        const updated = await getAsync(`SELECT b.*, e.name as equipment_name FROM bookings b JOIN equipment e ON b.equipment_id = e.id WHERE b.id = ?`, [id]);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/bookings/:id - cancel/delete
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const booking = await getAsync(`SELECT b.*, e.owner_id FROM bookings b JOIN equipment e ON b.equipment_id = e.id WHERE b.id = ?`, [id]);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.renter_id !== req.user.id && booking.owner_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
        await runAsync(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`, [id]);
        res.json({ message: 'Booking cancelled' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
