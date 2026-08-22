function getMockWeather(location = 'Sehore') {
    // Deterministic mock based on location string + date
    const temps = { 'Sehore': 32, 'Ludhiana': 28, 'Nashik': 30, 'Karnal': 29, 'Bathinda': 31, 'Indore': 33, 'Jaipur': 35, 'Anand': 34, 'Nagpur': 32, 'Pune': 27 };
    // Seed from location
    let baseTemp = 28;
    for (const key in temps) {
        if (location.includes(key)) baseTemp = temps[key];
    }
    // Add variation
    const rainProb = Math.floor(Math.random() * 60); // For deterministic, we'll use hash
    // But for API, we want deterministic per location + date combo: use simple hash
    return {
        location,
        temperature: baseTemp + Math.floor(Math.random()*3) -1,
        humidity: 60 + Math.floor(Math.random()*20),
        rainProbability: rainProb,
        windSpeed: 8 + Math.floor(Math.random()*10),
        condition: rainProb > 50 ? 'Rainy' : rainProb > 30 ? 'Cloudy' : 'Sunny',
        forecast: generateForecast()
    };
}

function generateForecast() {
    const days = ['Today','Tomorrow','Day 3','Day 4','Day 5'];
    return days.map((d, i) => {
        const rain = Math.floor(Math.random()*100);
        return {
            day: d,
            temp: 28 + Math.floor(Math.random()*5),
            rainProbability: rain,
            condition: rain > 60 ? 'Heavy Rain' : rain > 40 ? 'Light Rain' : rain > 20 ? 'Cloudy' : 'Sunny'
        };
    });
}

function getRecommendation(equipmentType, weather) {
    const rain = weather.rainProbability;
    const temp = weather.temperature;
    if (equipmentType === 'harvester') {
        if (rain < 20) return { recommended: true, message: 'Good day for harvesting. Dry conditions expected.', icon: '✅' };
        if (rain < 40) return { recommended: true, message: 'Suitable for harvesting but watch for light rain.', icon: '⚠️' };
        return { recommended: false, message: 'Not recommended. Rain is expected on this day.', icon: '❌' };
    }
    if (equipmentType === 'tractor') {
        if (rain > 60) return { recommended: false, message: 'Not suitable for tractor work. Heavy rain expected, soil too wet.', icon: '❌' };
        if (rain > 40) return { recommended: true, message: 'Conditions okay for tractor, but soil may be soft.', icon: '⚠️' };
        return { recommended: true, message: 'Suitable conditions for tractor work.', icon: '✅' };
    }
    if (equipmentType === 'cultivator') {
        if (rain > 70) return { recommended: false, message: 'Avoid cultivator use - waterlogged fields.', icon: '❌' };
        return { recommended: true, message: 'Good conditions for soil preparation.', icon: '✅' };
    }
    if (equipmentType === 'seeder') {
        if (rain < 30 && temp > 20 && temp < 35) return { recommended: true, message: 'Excellent for sowing. Soil moisture optimal.', icon: '✅' };
        if (rain > 60) return { recommended: false, message: 'Too wet for seeding, wait for drier day.', icon: '❌' };
        return { recommended: true, message: 'Sowing possible, check soil moisture.', icon: '⚠️' };
    }
    if (equipmentType === 'irrigation') {
        if (rain > 50) return { recommended: false, message: 'Irrigation not needed, rain expected.', icon: '❌' };
        return { recommended: true, message: 'Good day for irrigation, dry conditions.', icon: '✅' };
    }
    // other
    if (rain > 50) return { recommended: false, message: 'Rain expected, plan accordingly.', icon: '⚠️' };
    return { recommended: true, message: 'Favorable conditions for farm work.', icon: '✅' };
}

module.exports = { getMockWeather, getRecommendation, generateForecast };
