import AqiReading from '../models/AqiReading.js';
import WeatherReading from '../models/WeatherReading.js';

/**
 * Map common Indian cities to their states
 */
function getCityStateMapping(cityName) {
  const cityStateMap = {
    'Delhi': { city: 'Delhi', state: 'Delhi', country: 'India', lat: 28.6139, lon: 77.2090 },
    'Mumbai': { city: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.0760, lon: 72.8777 },
    'Bangalore': { city: 'Bangalore', state: 'Karnataka', country: 'India', lat: 12.9716, lon: 77.5946 },
    'Kolkata': { city: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5726, lon: 88.3639 },
    'Chennai': { city: 'Chennai', state: 'Tamil Nadu', country: 'India', lat: 13.0827, lon: 80.2707 },
    'Hyderabad': { city: 'Hyderabad', state: 'Telangana', country: 'India', lat: 17.3850, lon: 78.4867 },
    'Pune': { city: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.5204, lon: 73.8567 },
    'Ahmedabad': { city: 'Ahmedabad', state: 'Gujarat', country: 'India', lat: 23.0225, lon: 72.5714 },
    'Jaipur': { city: 'Jaipur', state: 'Rajasthan', country: 'India', lat: 26.9124, lon: 75.7873 },
    'Lucknow': { city: 'Lucknow', state: 'Uttar Pradesh', country: 'India', lat: 26.8467, lon: 80.9462 },
  };

  const normalizedCity = cityName.trim();
  if (cityStateMap[normalizedCity]) {
    return cityStateMap[normalizedCity];
  }

  return null;
}

/**
 * Get city coordinates from city name
 * If city name is provided, use it directly. Otherwise, try to geocode it.
 * @param {string} cityName - City name (e.g., "Delhi", "Mumbai")
 * @param {string} state - Optional state name
 * @param {string} country - Optional country name (default: India)
 */
function getCityCoordinates(cityName, state = '', country = 'India') {
  // Check if city is in our mapping
  const mapped = getCityStateMapping(cityName);
  if (mapped) {
    return mapped;
  }

  // If coordinates are provided in the city name (format: "City,State,Country" or "City,lat,lon")
  if (cityName.includes(',')) {
    const parts = cityName.split(',').map(p => p.trim());
    if (parts.length >= 3 && !isNaN(parseFloat(parts[1]))) {
      // Format: "City,lat,lon"
      return {
        city: parts[0],
        state: state || '',
        country: country,
        lat: parseFloat(parts[1]),
        lon: parseFloat(parts[2]),
      };
    } else if (parts.length >= 2) {
      // Format: "City,State" or "City,State,Country"
      return {
        city: parts[0],
        state: parts[1] || state,
        country: parts[2] || country,
        lat: null,
        lon: null,
      };
    }
  }

  // Default: use city name directly (will try nearest_station endpoint)
  return {
    city: cityName,
    state: state || '',
    country: country,
    lat: null,
    lon: null,
  };
}

/**
 * Fetch and store AQI data from Air Visual API
 * @param {string} cityName - City name (e.g., "Delhi", "Mumbai")
 * @param {string} state - Optional state name
 * @param {string} country - Optional country name (default: India)
 * @param {boolean} forceFetch - Force fetch even if recent data exists (default: false)
 */
export async function fetchAndStoreAqi(cityName, state = '', country = 'India', forceFetch = false) {
  try {
    if (!cityName) {
      throw new Error('City name is required');
    }

    // Use city name as location identifier
    const location = cityName;

    // Check if we have recent data (within last 6 hours) to avoid unnecessary API calls
    if (!forceFetch) {
      const recentReading = await AqiReading.findOne({ location })
        .sort({ timestamp: -1 })
        .lean();
      
      if (recentReading) {
        const ageHours = (Date.now() - new Date(recentReading.timestamp).getTime()) / (1000 * 60 * 60);
        if (ageHours < 6) {
          console.log(`📊 Using cached AQI data for ${location} (${Math.round(ageHours * 10) / 10} hours old)`);
          return recentReading;
        }
      }
    }

    let aqiData = null;
    let source = 'airvisual';

    // Air Visual API is required
    const airVisualKey = process.env.AIR_VISUAL_API_KEY;
    
    if (!airVisualKey) {
      throw new Error('AIR_VISUAL_API_KEY is not configured. Please set it in your .env file.');
    }

    console.log(`🔑 Using Air Visual API key: ${airVisualKey.substring(0, 8)}...`);
    try {
      const coords = getCityCoordinates(cityName, state, country);
      
      let url = null;
      let endpointUsed = '';
      let response = null;
      let responseData = null;
      
      // Strategy 1: Try city endpoint if we have state and country
      if (coords.state && coords.country) {
        url = `https://api.airvisual.com/v2/city?city=${encodeURIComponent(coords.city)}&state=${encodeURIComponent(coords.state)}&country=${encodeURIComponent(coords.country)}&key=${airVisualKey}`;
        endpointUsed = 'city';
        
        console.log(`🌬️ Fetching AQI from Air Visual (city endpoint) for ${coords.city}, ${coords.state}, ${coords.country}...`);
        response = await fetch(url);
        responseData = await response.json();
        
        // If city endpoint fails, try nearest_station if we have coordinates
        if (!response.ok && coords.lat && coords.lon) {
          console.log(`🔄 City endpoint failed (${responseData.data?.message || response.status}), trying nearest_station endpoint...`);
          url = `https://api.airvisual.com/v2/nearest_station?lat=${coords.lat}&lon=${coords.lon}&key=${airVisualKey}`;
          endpointUsed = 'nearest_station';
          response = await fetch(url);
          responseData = await response.json();
        }
      } else if (coords.lat && coords.lon) {
        // Strategy 2: Use nearest_station if we have coordinates
        url = `https://api.airvisual.com/v2/nearest_station?lat=${coords.lat}&lon=${coords.lon}&key=${airVisualKey}`;
        endpointUsed = 'nearest_station';
        
        console.log(`🌬️ Fetching AQI from Air Visual (nearest_station) for coordinates ${coords.lat}, ${coords.lon}...`);
        response = await fetch(url);
        responseData = await response.json();
      } else {
        // Strategy 3: Try city endpoint with just city name (may fail but worth trying)
        url = `https://api.airvisual.com/v2/city?city=${encodeURIComponent(coords.city)}&state=${encodeURIComponent(coords.state || '')}&country=${encodeURIComponent(coords.country)}&key=${airVisualKey}`;
        endpointUsed = 'city';
        
        console.log(`🌬️ Fetching AQI from Air Visual (city endpoint) for ${coords.city}...`);
        response = await fetch(url);
        responseData = await response.json();
      }
      
      if (response.ok && responseData.status === 'success') {
        // Both endpoints return data.current.pollution
        const pollution = responseData.data?.current?.pollution;
        
        if (pollution) {
          // Air Visual uses aqius (US AQI) or aqicn (China AQI)
          const aqi = pollution.aqius || pollution.aqicn || 50;
          
          // PM values - estimate if not provided directly
          const pm25 = pollution.pm25 || Math.round(aqi * 0.6);
          const pm10 = pollution.pm10 || Math.round(aqi * 0.8);
          
          aqiData = {
            aqi: aqi,
            pm25: pm25,
            pm10: pm10,
          };
          source = 'airvisual';
          console.log(`✅ AQI data fetched from Air Visual (${endpointUsed}): AQI ${aqi}, PM2.5: ${pm25}, PM10: ${pm10}`);
        } else {
          console.warn(`⚠️ Air Visual API: No pollution data in response`);
        }
      } else {
        // Handle API errors
        const errorMsg = responseData.data?.message || responseData.message || `HTTP ${response.status}`;
        console.error(`❌ Air Visual API error: ${errorMsg}`);
        
        if (responseData.data) {
          console.error(`   Error details:`, JSON.stringify(responseData.data));
        }
        throw new Error(`Air Visual API error: ${errorMsg}`);
      }
    } catch (apiError) {
      console.error('❌ Air Visual API call failed:', apiError.message);
      throw new Error(`Failed to fetch AQI data: ${apiError.message}`);
    }

    // Throw error if no data was fetched
    if (!aqiData) {
      throw new Error('Failed to fetch AQI data from Air Visual API.');
    }

    const reading = new AqiReading({
      location,
      timestamp: new Date(),
      aqi: aqiData.aqi,
      pm25: aqiData.pm25,
      pm10: aqiData.pm10,
      source,
      raw: aqiData,
    });

    await reading.save();
    return reading;
  } catch (error) {
    console.error('Error fetching AQI:', error);
    throw error;
  }
}

/**
 * Fetch and store Weather data from API
 * @param {string} cityName - City name (e.g., "Delhi", "Mumbai")
 * @param {boolean} forceFetch - Force fetch even if recent data exists (default: false)
 */
export async function fetchAndStoreWeather(cityName, forceFetch = false) {
  try {
    if (!cityName) {
      throw new Error('City name is required');
    }

    // Use city name as location identifier
    const location = cityName;

    // Check if we have recent data (within last 6 hours) to avoid unnecessary API calls
    if (!forceFetch) {
      const recentReading = await WeatherReading.findOne({ location })
        .sort({ timestamp: -1 })
        .lean();
      
      if (recentReading) {
        const ageHours = (Date.now() - new Date(recentReading.timestamp).getTime()) / (1000 * 60 * 60);
        if (ageHours < 6) {
          console.log(`📊 Using cached weather data for ${location} (${Math.round(ageHours * 10) / 10} hours old)`);
          return recentReading;
        }
      }
    }

    let weatherData = null;
    let source = 'openweathermap';

    // OpenWeatherMap API is required
    if (!process.env.WEATHER_API_KEY) {
      throw new Error('WEATHER_API_KEY is not configured. Please set it in your .env file.');
    }
    try {
      const apiKey = process.env.WEATHER_API_KEY;
      // OpenWeatherMap API endpoint
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${apiKey}&units=metric`;
      
      console.log(`🌤️ Fetching weather for ${cityName}...`);
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        // Check if API returned an error
        if (data.cod && data.cod !== 200) {
          throw new Error(data.message || 'API returned an error');
        }
        
        // Convert temperature from Celsius (already in metric units)
        const temp = data.main?.temp;
        // Humidity is already a percentage
        const humidity = data.main?.humidity;
        // Wind speed in m/s, convert to km/h
        const windSpeedMs = data.wind?.speed || 0;
        const windSpeedKmh = windSpeedMs * 3.6;
        // Precipitation (rain in last hour, convert from mm)
        const precipitation = data.rain?.['1h'] || data.rain?.['3h'] || 0;

        if (temp === undefined || humidity === undefined) {
          throw new Error('Incomplete weather data received from API');
        }

        weatherData = {
          temperature: Math.round(temp * 10) / 10, // Round to 1 decimal
          humidity: Math.round(humidity),
          windSpeed: Math.round(windSpeedKmh * 10) / 10, // Round to 1 decimal
          precipitation: Math.round(precipitation * 10) / 10, // Round to 1 decimal
        };
        console.log(`✅ Weather data fetched from OpenWeatherMap: ${temp}°C, ${humidity}% humidity`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || `HTTP ${response.status}`;
        console.error(`❌ Weather API error: ${errorMsg}`);
        throw new Error(`Weather API error: ${errorMsg}`);
      }
    } catch (apiError) {
      console.error('❌ Weather API call failed:', apiError.message);
      throw new Error(`Failed to fetch weather data: ${apiError.message}`);
    }

    // Throw error if no data was fetched
    if (!weatherData) {
      throw new Error('Failed to fetch weather data from OpenWeatherMap API.');
    }

    const reading = new WeatherReading({
      location,
      timestamp: new Date(),
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      windSpeed: weatherData.windSpeed,
      precipitation: weatherData.precipitation,
      raw: weatherData,
    });

    await reading.save();
    return reading;
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw error;
  }
}

/**
 * Get latest AQI for a city (uses cached data, doesn't fetch from API)
 * Use fetchAndStoreAqi() if you need fresh data
 * @param {string} cityName - City name
 */
export async function getLatestAqi(cityName) {
  if (!cityName) {
    return null;
  }
  return await AqiReading.findOne({ location: cityName })
    .sort({ timestamp: -1 })
    .lean();
}

/**
 * Get latest Weather for a city
 * @param {string} cityName - City name
 */
export async function getLatestWeather(cityName) {
  if (!cityName) {
    return null;
  }
  return await WeatherReading.findOne({ location: cityName })
    .sort({ timestamp: -1 })
    .lean();
}

/**
 * Get AQI history for a city
 * @param {string} cityName - City name
 * @param {number} days - Number of days of history
 */
export async function getAqiHistory(cityName, days = 7) {
  if (!cityName) {
    return [];
  }
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await AqiReading.find({
    location: cityName,
    timestamp: { $gte: startDate },
  })
    .sort({ timestamp: 1 })
    .lean();
}

/**
 * Get Weather history for a city
 * @param {string} cityName - City name
 * @param {number} days - Number of days of history
 */
export async function getWeatherHistory(cityName, days = 7) {
  if (!cityName) {
    return [];
  }
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await WeatherReading.find({
    location: cityName,
    timestamp: { $gte: startDate },
  })
    .sort({ timestamp: 1 })
    .lean();
}

