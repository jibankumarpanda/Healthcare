import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { runOperationsAgent } from '../services/geminiService.js';
import { getLatestAqi, getLatestWeather, fetchAndStoreAqi, fetchAndStoreWeather } from '../services/dataService.js';
import { getLatestPrediction } from '../services/predictionService.js';

const router = express.Router();

/**
 * POST /api/agent/chat
 * Conversational AI agent for operational insights with real-time data
 */
router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { message, context = {} } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A user message is required',
      });
    }

    // Get region from context or default
    const region = context.region || 'North';

    // Use cached data (scheduler handles regular updates every 5 minutes)
    // This prevents "Too Many Requests" errors from API
    const aqi = await getLatestAqi(region);
    const weather = await getLatestWeather(region);
    const prediction = await getLatestPrediction(region);

    // Build enhanced context with real-time data
    const enhancedContext = {
      ...context,
      region,
      realTimeData: {
        aqi: aqi ? {
          value: aqi.aqi,
          pm25: aqi.pm25,
          pm10: aqi.pm10,
          status: aqi.aqi > 150 ? 'Unhealthy' : aqi.aqi > 100 ? 'Moderate' : 'Good',
        } : null,
        weather: weather ? {
          temperature: weather.temperature,
          humidity: weather.humidity,
          windSpeed: weather.windSpeed,
          precipitation: weather.precipitation,
        } : null,
        prediction: prediction ? {
          surgeProbability: prediction.surgeProbability,
          suggestedMedicines: prediction.suggestedMedicines || [],
          suggestedDiseases: prediction.suggestedDiseases || [],
          staffAdvice: prediction.staffAdvice,
          supplyAdvice: prediction.supplyAdvice,
        } : null,
      },
      timestamp: new Date().toISOString(),
    };

    const agentResponse = await runOperationsAgent(message, enhancedContext);

    res.json({
      success: true,
      data: agentResponse,
      metadata: {
        model: agentResponse.modelVersion,
        generatedAt: agentResponse.generatedAt,
        region,
        dataTimestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('AI agent error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to generate agent response',
    });
  }
});

export default router;




