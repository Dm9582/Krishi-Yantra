const express = require('express');
const { getMockWeather, getRecommendation } = require('../services/weatherService');
const router = express.Router();

// GET /api/weather?location=Sehore
router.get('/', (req, res) => {
    const location = req.query.location || 'Sehore, Madhya Pradesh';
    const weather = getMockWeather(location);
    res.json(weather);
});

// GET /api/weather/recommendation?equipmentType=harvester&date=2026-08-20&location=Sehore
router.get('/recommendation', (req, res) => {
    const { equipmentType, date, location } = req.query;
    if (!equipmentType) return res.status(400).json({ error: 'equipmentType required' });
    const weather = getMockWeather(location || 'Sehore');
    // If date provided, adjust rain probability deterministically based on date string
    if (date) {
        // Simple hash to vary rain per date
        let hash = 0;
        for (let i=0; i<date.length; i++) hash = (hash*31 + date.charCodeAt(i)) % 100;
        weather.rainProbability = (weather.rainProbability + hash) % 100;
        if (weather.rainProbability > 70) weather.condition = 'Rainy';
        else if (weather.rainProbability > 40) weather.condition = 'Cloudy';
        else weather.condition = 'Sunny';
    }
    const recommendation = getRecommendation(equipmentType.toLowerCase(), weather);
    res.json({
        date: date || new Date().toISOString().split('T')[0],
        location: location || 'Sehore',
        weather,
        recommendation
    });
});

// GET /api/weather/forecast?location=...
router.get('/forecast', (req, res) => {
    const location = req.query.location || 'Sehore';
    const weather = getMockWeather(location);
    res.json({ location, forecast: weather.forecast, current: weather });
});

module.exports = router;
