import PandemicData from '../models/PandemicData.js';
import { getLatestAqi } from './dataService.js';
import { getDiseasesForConditions } from './diseaseMedicineService.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { withRetry } from '../utils/geminiRetry.js';
import { GEMINI_MODEL } from '../utils/geminiConfig.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Get active pandemic data for a region
 */
export async function getActivePandemics(region, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const pandemics = await PandemicData.find({
    region,
    date: { $gte: startDate },
    activeCases: { $gt: 0 },
    severity: { $in: ['moderate', 'high', 'critical'] }, // Only return significant pandemics
  })
    .sort({ date: -1, activeCases: -1 })
    .lean();

  // Group by disease and get latest data
  const diseaseMap = new Map();
  pandemics.forEach(p => {
    if (!diseaseMap.has(p.diseaseName) || diseaseMap.get(p.diseaseName).date < p.date) {
      diseaseMap.set(p.diseaseName, p);
    }
  });

  return Array.from(diseaseMap.values());
}

/**
 * Get total active cases for a region
 */
export async function getTotalActiveCases(region) {
  const activePandemics = await getActivePandemics(region, 7);
  return activePandemics.reduce((sum, p) => sum + p.activeCases, 0);
}

/**
 * Get required medicines from active pandemics
 */
export async function getRequiredMedicinesFromPandemics(region) {
  const activePandemics = await getActivePandemics(region, 7);
  const medicinesSet = new Set();
  
  activePandemics.forEach(p => {
    if (p.requiredMedicines && p.requiredMedicines.length > 0) {
      p.requiredMedicines.forEach(med => medicinesSet.add(med));
    }
  });

  return Array.from(medicinesSet);
}

/**
 * Create or update pandemic data
 */
export async function createPandemicData(data) {
  const pandemic = new PandemicData(data);
  await pandemic.save();
  return pandemic;
}

/**
 * Use Gemini AI to detect and analyze potential pandemics based on conditions
 */
async function detectPandemicsWithGemini(region, weather, aqi, surgeProbability, existingPandemics = []) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not configured, using basic pandemic detection');
      return null;
    }

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `
You are a medical epidemiologist AI analyzing healthcare surge data to detect potential disease outbreaks.

Current Conditions:
- Region: ${region}
- Surge Probability: ${surgeProbability}%
- Temperature: ${weather?.temperature || 'N/A'}°C
- Humidity: ${weather?.humidity || 'N/A'}%
- Air Quality Index (AQI): ${aqi?.aqi || 'N/A'}
- PM2.5: ${aqi?.pm25 || 'N/A'} μg/m³
- PM10: ${aqi?.pm10 || 'N/A'} μg/m³

Existing Active Pandemics: ${existingPandemics.length > 0 ? JSON.stringify(existingPandemics.map(p => ({ name: p.diseaseName, cases: p.activeCases, severity: p.severity }))) : 'None'}

Based on these conditions, analyze if there are potential disease outbreaks or pandemics. Consider:
1. High AQI → respiratory diseases (asthma, COPD, pneumonia)
2. High temperature + high humidity → heat-related illnesses, vector-borne diseases
3. Low temperature → flu, cold, pneumonia
4. High surge probability → potential outbreak
5. Existing pandemics → may be spreading or new cases

Output MUST be valid JSON with this structure:
{
  "detectedPandemics": [
    {
      "diseaseName": "string (e.g., 'Influenza', 'Respiratory Infection', 'Heat Stroke')",
      "activeCases": number (estimated, 0-1000),
      "newCasesLast24h": number (estimated, 0-100),
      "severity": "low" | "moderate" | "high" | "critical",
      "transmissionRate": number (0-10, R0 value),
      "affectedAgeGroups": ["string array"],
      "symptoms": ["string array"],
      "requiredMedicines": ["string array of medicine names"],
      "notes": "string explaining why this pandemic was detected"
    }
  ],
  "confidence": "high" | "medium" | "low",
  "analysis": "brief explanation of findings"
}

Only include pandemics if surge probability > 40% or if environmental conditions strongly suggest an outbreak.
Limit to maximum 3 most likely pandemics.
`;

    const result = await withRetry(
      async () => await model.generateContent(prompt),
      { maxRetries: 3, initialDelay: 2000, maxDelay: 60000 }
    );
    const response = await result.response;
    const rawText = response.text().trim();

    try {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (parseError) {
      console.warn('Gemini pandemic detection returned non-JSON, using fallback');
      return null;
    }
  } catch (error) {
    console.error('Error in Gemini pandemic detection:', error);
    return null;
  }
}

/**
 * Analyze conditions and create pandemic data using Gemini AI
 */
export async function analyzeAndCreatePandemicData(region, weather, aqi, surgeProbability) {
  try {
    // Only analyze if surge probability indicates potential outbreak
    if (surgeProbability < 40) {
      return [];
    }

    // Get existing active pandemics
    const existingPandemics = await getActivePandemics(region, 7);

    // Use Gemini to detect pandemics
    const geminiAnalysis = await detectPandemicsWithGemini(region, weather, aqi, surgeProbability, existingPandemics);

    const pandemicRecords = [];

    if (geminiAnalysis && geminiAnalysis.detectedPandemics && geminiAnalysis.detectedPandemics.length > 0) {
      console.log(`🤖 Gemini detected ${geminiAnalysis.detectedPandemics.length} potential pandemic(s) for ${region}`);

      for (const pandemic of geminiAnalysis.detectedPandemics) {
        // Check if we already have recent data for this disease
        const existing = await PandemicData.findOne({
          region,
          diseaseName: pandemic.diseaseName,
          date: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        });

        if (!existing) {
          const pandemicData = await createPandemicData({
            region,
            date: new Date(),
            diseaseName: pandemic.diseaseName,
            activeCases: Math.max(0, Math.round(pandemic.activeCases || 50 * (surgeProbability / 100))),
            newCases: Math.max(0, Math.round(pandemic.newCasesLast24h || 10 * (surgeProbability / 100))),
            recovered: Math.round((pandemic.activeCases || 50) * 0.2),
            deaths: Math.round((pandemic.activeCases || 50) * 0.01),
            severity: pandemic.severity || (surgeProbability > 70 ? 'high' : surgeProbability > 50 ? 'moderate' : 'low'),
            transmissionRate: Math.min(10, Math.max(0, pandemic.transmissionRate || (surgeProbability / 100) * 3)),
            affectedAgeGroups: pandemic.affectedAgeGroups || ['adults', 'elderly'],
            symptoms: pandemic.symptoms || ['fever', 'cough', 'fatigue'],
            requiredMedicines: pandemic.requiredMedicines || [],
            notes: pandemic.notes || `AI-detected based on surge probability ${surgeProbability}% and environmental conditions. ${geminiAnalysis.analysis || ''}`,
            source: 'gemini-ai',
          });

          pandemicRecords.push(pandemicData);
          console.log(`✅ Created pandemic record: ${pandemic.diseaseName} (${pandemicData.activeCases} active cases, severity: ${pandemicData.severity})`);
        } else {
          // Update existing pandemic with new data
          existing.activeCases = Math.max(existing.activeCases, Math.round(pandemic.activeCases || existing.activeCases));
          existing.newCases = Math.max(existing.newCases, Math.round(pandemic.newCasesLast24h || existing.newCases));
          existing.severity = pandemic.severity || existing.severity;
          existing.transmissionRate = pandemic.transmissionRate || existing.transmissionRate;
          if (pandemic.requiredMedicines && pandemic.requiredMedicines.length > 0) {
            existing.requiredMedicines = [...new Set([...existing.requiredMedicines, ...pandemic.requiredMedicines])];
          }
          await existing.save();
          console.log(`🔄 Updated existing pandemic: ${pandemic.diseaseName}`);
        }
      }
    } else {
      // If Gemini fails and no real data available, clear old pandemic data
      // Only keep pandemic data if we have real detection
      console.log(`⚠️ Gemini pandemic detection failed for ${region}. Clearing old pandemic data if no real data available.`);
      
      // Clear old pandemic data (older than 7 days) if no recent real data exists
      const recentRealData = await PandemicData.findOne({
        region,
        date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        source: { $in: ['gemini-ai', 'system'] }, // Keep only AI-detected or system data
      });

      if (!recentRealData) {
        // Clear old pandemic data
        const deleted = await PandemicData.deleteMany({
          region,
          date: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          source: 'basic-analysis', // Remove fallback-generated data
        });
        if (deleted.deletedCount > 0) {
          console.log(`🧹 Cleared ${deleted.deletedCount} old pandemic records for ${region}`);
        }
      }
    }

    return pandemicRecords;
  } catch (error) {
    console.error('Error analyzing pandemic data:', error);
    return [];
  }
}

/**
 * Calculate estimated patient count based on pandemic data
 */
export async function calculatePatientCountFromPandemics(region, basePatientCount, surgeProbability) {
  try {
    const totalActiveCases = await getTotalActiveCases(region);
    
    // Base calculation
    let estimatedCount = basePatientCount;
    
    // Add surge multiplier
    const surgeMultiplier = 1 + (surgeProbability / 100) * 0.5;
    estimatedCount = Math.round(estimatedCount * surgeMultiplier);
    
    // Add active pandemic cases (weighted)
    // Active cases contribute but not 1:1 (some may be home care, etc.)
    const pandemicContribution = Math.round(totalActiveCases * 0.3);
    estimatedCount += pandemicContribution;
    
    return Math.max(basePatientCount, estimatedCount);
  } catch (error) {
    console.error('Error calculating patient count from pandemics:', error);
    // Fallback to base calculation
    return Math.round(basePatientCount * (1 + (surgeProbability / 100) * 0.5));
  }
}


