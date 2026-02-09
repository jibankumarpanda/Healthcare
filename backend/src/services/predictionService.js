import Prediction from '../models/Prediction.js';
import HospitalStats from '../models/HospitalStats.js';
import { getLatestAqi, getLatestWeather, getAqiHistory, getWeatherHistory, fetchAndStoreAqi, fetchAndStoreWeather } from './dataService.js';
import { runOperationsAgent } from './geminiService.js';
import { getDiseasesForConditions, getMedicinesForDiseases } from './diseaseMedicineService.js';
import { 
  analyzeAndCreatePandemicData, 
  calculatePatientCountFromPandemics,
  getActivePandemics,
  getRequiredMedicinesFromPandemics 
} from './pandemicService.js';
import { GEMINI_MODEL } from '../utils/geminiConfig.js';

/**
 * Calculate surge probability based on features
 */
function calculateSurgeProbability(features) {
  let probability = 20; // Base probability

  // AQI impact
  if (features.aqi > 150) probability += 25;
  else if (features.aqi > 100) probability += 15;
  else if (features.aqi > 50) probability += 5;

  // Weather impact
  if (features.temperature > 35) probability += 15; // Heat waves
  if (features.humidity > 80) probability += 10; // High humidity
  if (features.precipitation > 5) probability += 5; // Rain

  // Historical admissions impact
  if (features.admissionsLast7dAvg > features.baselineAdmissions * 1.2) {
    probability += 20;
  }

  // Festival impact
  if (features.isFestival) {
    probability += features.festivalMultiplier * 10;
  }

  return Math.min(100, Math.max(0, probability));
}

/**
 * Generate predictions with AI agent
 * @param {string} cityName - City name (e.g., "Delhi", "Mumbai")
 * @param {Date} date - Date for prediction (default: today)
 */
export async function generatePrediction(cityName, date = new Date()) {
  try {
    if (!cityName) {
      throw new Error('City name is required');
    }

    // Fetch latest data for the city - try to fetch if missing
    let aqi = await getLatestAqi(cityName);
    let weather = await getLatestWeather(cityName);
    
    // If weather is missing, try to fetch it (required)
    if (!weather) {
      console.log(`⚠️ No weather data found for ${cityName}, attempting to fetch...`);
      try {
        weather = await fetchAndStoreWeather(cityName, true);
      } catch (weatherError) {
        console.error(`❌ Failed to fetch weather for ${cityName}:`, weatherError.message);
        throw new Error(`Weather data is required but could not be fetched for ${cityName}. Please check your WEATHER_API_KEY configuration.`);
      }
    }
    
    // If AQI is missing, try to fetch it (optional - use defaults if it fails)
    if (!aqi) {
      console.log(`⚠️ No AQI data found for ${cityName}, attempting to fetch...`);
      try {
        aqi = await fetchAndStoreAqi(cityName, '', 'India', true);
      } catch (aqiError) {
        console.error(`❌ Failed to fetch AQI for ${cityName}:`, aqiError.message);
        console.log(`⚠️ Using default AQI values based on weather conditions`);
        // Use default AQI values based on weather conditions
        // Higher temperature and low humidity might indicate higher pollution
        const defaultAqi = weather.temperature > 35 ? 80 : weather.temperature > 25 ? 60 : 50;
        aqi = {
          aqi: defaultAqi,
          pm25: Math.round(defaultAqi * 0.6),
          pm10: Math.round(defaultAqi * 0.8),
          location: cityName,
          timestamp: new Date(),
          source: 'estimated',
        };
      }
    }
    
    const aqiHistory = await getAqiHistory(cityName, 7);
    const weatherHistory = await getWeatherHistory(cityName, 7);

    // Get hospital stats (using cityName as region identifier for backward compatibility)
    const hospitalStats = await HospitalStats.find({ region: cityName })
      .sort({ date: -1 })
      .limit(7)
      .lean();

    const admissionsLast7d = hospitalStats.map(s => s.admissions);
    const admissionsLast7dAvg = admissionsLast7d.length > 0
      ? admissionsLast7d.reduce((a, b) => a + b, 0) / admissionsLast7d.length
      : 50;

    // Validate that we have required data
    if (!aqi || !weather) {
      throw new Error(`Missing data for city ${cityName}. AQI and Weather data are required.`);
    }

    // Build features
    const features = {
      city: cityName,
      date: date.toISOString(),
      aqi: aqi.aqi,
      pm25: aqi.pm25,
      pm10: aqi.pm10,
      temperature: weather.temperature,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed,
      precipitation: weather.precipitation,
      admissionsLast7dAvg,
      baselineAdmissions: 50,
      isFestival: false,
      festivalMultiplier: 0,
    };

    // Calculate surge probability
    const surgeProbability = calculateSurgeProbability(features);

    // Use AI agent to generate detailed advice
    const agentContext = {
      city: cityName,
      date: date.toISOString(),
      features,
      surgeProbability,
      aqi: aqi.aqi,
      weather: {
        temperature: weather.temperature,
        humidity: weather.humidity,
      },
    };

    const agentResponse = await runOperationsAgent(
      `Generate detailed prediction and recommendations for ${cityName} city on ${date.toISOString().split('T')[0]}. Surge probability: ${surgeProbability}%. AQI: ${features.aqi}, Temperature: ${features.temperature}°C, Humidity: ${features.humidity}%.`,
      agentContext
    );

    // Get real diseases and medicines from API
    const suggestedDiseases = await getDiseasesForConditions(weather, aqi, surgeProbability);
    const suggestedMedicines = await getMedicinesForDiseases(suggestedDiseases, weather, aqi);

    // Analyze and create pandemic data if conditions indicate potential outbreak
    const pandemicData = await analyzeAndCreatePandemicData(cityName, weather, aqi, surgeProbability);
    
    // Get active pandemics for this city
    const activePandemics = await getActivePandemics(cityName, 7);
    
    // Get required medicines from active pandemics
    const pandemicMedicines = await getRequiredMedicinesFromPandemics(cityName);
    
    // Combine medicines from conditions and pandemics
    const allMedicines = [...new Set([...suggestedMedicines, ...pandemicMedicines])];

    // Calculate estimated patient count using pandemic data
    const baselinePatients = 100; // Base patient count
    const estimatedPatientCount = await calculatePatientCountFromPandemics(cityName, baselinePatients, surgeProbability);

    // Create prediction record (using cityName as region for backward compatibility with schema)
    const prediction = new Prediction({
      region: cityName,
      date,
      surgeProbability,
      estimatedPatientCount,
      modelVersion: GEMINI_MODEL,
      inputSnapshot: features,
      staffAdvice: {
        doctors: Math.ceil(10 * (1 + surgeProbability / 100)),
        nurses: Math.ceil(20 * (1 + surgeProbability / 100)),
        supportStaff: Math.ceil(5 * (1 + surgeProbability / 100)),
        notes: agentResponse.staffingPlan || 'Standard staffing levels',
      },
      supplyAdvice: {
        oxygen: Math.ceil(1000 * (1 + surgeProbability / 100)),
        medicines: allMedicines,
        ppe: Math.ceil(500 * (1 + surgeProbability / 100)),
        notes: agentResponse.supplyPlan || 'Standard supply levels',
      },
      topFactors: [
        { feature: 'aqi', impact: features.aqi > 100 ? 0.3 : 0.1 },
        { feature: 'temperature', impact: features.temperature > 35 ? 0.25 : 0.1 },
        { feature: 'admissions_trend', impact: admissionsLast7dAvg > 60 ? 0.2 : 0.1 },
      ],
      suggestedMedicines: allMedicines,
      suggestedDiseases,
      activePandemics: activePandemics.map(p => ({
        diseaseName: p.diseaseName,
        activeCases: p.activeCases,
        newCases: p.newCases,
        severity: p.severity,
        transmissionRate: p.transmissionRate,
      })),
      weatherImpact: agentResponse.weatherImpact || 'Normal weather conditions',
      aqiImpact: agentResponse.aqiImpact || 'Normal air quality',
    });

    await prediction.save();
    return prediction;
  } catch (error) {
    console.error('Error generating prediction:', error);
    throw error;
  }
}


/**
 * Get prediction history for a city
 * @param {string} cityName - City name
 * @param {number} days - Number of days of history
 */
export async function getPredictionHistory(cityName, days = 30) {
  if (!cityName) {
    return [];
  }
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await Prediction.find({
    region: cityName, // Using region field for backward compatibility
    date: { $gte: startDate },
  })
    .sort({ date: -1 })
    .lean();
}

/**
 * Get latest prediction for a city
 * @param {string} cityName - City name
 */
export async function getLatestPrediction(cityName) {
  if (!cityName) {
    return null;
  }
  return await Prediction.findOne({ region: cityName }) // Using region field for backward compatibility
    .sort({ date: -1 })
    .lean();
}

