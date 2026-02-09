import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { chatAboutDiseaseMedicine } from '../services/diseaseMedicineService.js';
import { getLatestAqi, getLatestWeather } from '../services/dataService.js';

const router = express.Router();

/**
 * POST /api/disease-medicine/chat
 * Chat with AI about diseases and medicines
 */
router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { question, region } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A question is required',
      });
    }

    // Get current conditions for context
    let context = {};
    if (region) {
      const aqi = await getLatestAqi(region);
      const weather = await getLatestWeather(region);
      context = { aqi, weather, region };
    }

    const answer = await chatAboutDiseaseMedicine(question, context);

    res.json({
      success: true,
      data: {
        question,
        answer,
        context: region ? context : null,
      },
    });
  } catch (error) {
    console.error('Disease/medicine chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to get answer',
    });
  }
});

export default router;







