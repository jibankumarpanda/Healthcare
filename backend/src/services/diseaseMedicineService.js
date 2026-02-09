import { withRetry } from '../utils/geminiRetry.js';
import { model as geminiModel, GEMINI_MODEL, genAI } from '../utils/geminiConfig.js';

// No need to initialize Gemini AI here, it's handled in geminiConfig.js

/**
 * Get real disease names based on weather and AQI conditions
 */
export async function getDiseasesForConditions(weather, aqi, surgeProbability) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return getDefaultDiseases(weather, aqi);
    }

    const model = geminiModel;

    const prompt = `
You are a medical expert. Based on the following environmental conditions, provide a list of REAL medical disease names (use proper medical terminology) that are likely to increase:

Weather Conditions:
- Temperature: ${weather?.temperature || 'N/A'}°C
- Humidity: ${weather?.humidity || 'N/A'}%
- Wind Speed: ${weather?.windSpeed || 'N/A'} km/h
- Precipitation: ${weather?.precipitation || 'N/A'} mm

Air Quality:
- AQI: ${aqi?.aqi || 'N/A'}
- PM2.5: ${aqi?.pm25 || 'N/A'}
- PM10: ${aqi?.pm10 || 'N/A'}

Surge Probability: ${surgeProbability}%

Provide a JSON array of disease names (use proper medical names like "Acute Respiratory Distress Syndrome" not "breathing problems"):
{
  "diseases": ["Disease Name 1", "Disease Name 2", ...],
  "explanations": {
    "Disease Name 1": "Brief explanation why this disease is likely",
    ...
  }
}

Return ONLY valid JSON, no markdown formatting.
`;

    const result = await withRetry(
      async () => await model.generateContent(prompt),
      { maxRetries: 3, initialDelay: 2000, maxDelay: 60000 }
    );
    const response = await result.response;
    const text = response.text().trim();

    // Parse JSON response
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return parsed.diseases || [];
    } catch (parseError) {
      console.warn('Failed to parse disease response, using defaults');
      return getDefaultDiseases(weather, aqi);
    }
  } catch (error) {
    console.error('Error fetching diseases:', error);
    return getDefaultDiseases(weather, aqi);
  }
}

/**
 * Get real medicine names based on diseases and conditions
 */
export async function getMedicinesForDiseases(diseases, weather, aqi) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return getDefaultMedicines(weather, aqi);
    }

    const model = geminiModel;

    const prompt = `
You are a medical expert. Based on the following diseases and conditions, provide a list of REAL medicine names (use proper pharmaceutical names):

Diseases to treat:
${diseases.map(d => `- ${d}`).join('\n')}

Weather Conditions:
- Temperature: ${weather?.temperature || 'N/A'}°C
- Humidity: ${weather?.humidity || 'N/A'}%

Air Quality:
- AQI: ${aqi?.aqi || 'N/A'}
- PM2.5: ${aqi?.pm25 || 'N/A'}

Provide a JSON array of medicine names (use proper pharmaceutical names like "Albuterol Sulfate" not "inhaler"):
{
  "medicines": ["Medicine Name 1", "Medicine Name 2", ...],
  "explanations": {
    "Medicine Name 1": "Brief explanation of use",
    ...
  }
}

Return ONLY valid JSON, no markdown formatting.
`;

    const result = await withRetry(
      async () => await model.generateContent(prompt),
      { maxRetries: 3, initialDelay: 2000, maxDelay: 60000 }
    );
    const response = await result.response;
    const text = response.text().trim();

    // Parse JSON response
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return parsed.medicines || [];
    } catch (parseError) {
      console.warn('Failed to parse medicine response, using defaults');
      return getDefaultMedicines(weather, aqi);
    }
  } catch (error) {
    console.error('Error fetching medicines:', error);
    return getDefaultMedicines(weather, aqi);
  }
}

/**
 * Default diseases based on conditions (fallback)
 */
function getDefaultDiseases(weather, aqi) {
  const diseases = [];

  if (aqi?.aqi > 100) {
    diseases.push('Asthma Exacerbation', 'Chronic Obstructive Pulmonary Disease (COPD)', 'Acute Bronchitis');
  }

  if (weather?.temperature > 35) {
    diseases.push('Heat Stroke', 'Heat Exhaustion', 'Dehydration');
  } else if (weather?.temperature < 15) {
    diseases.push('Hypothermia', 'Common Cold', 'Influenza', 'Pneumonia');
  }

  if (weather?.humidity > 80) {
    diseases.push('Fungal Skin Infections', 'Dermatophytosis');
  }

  if (weather?.precipitation > 5) {
    diseases.push('Waterborne Diseases', 'Vector-borne Diseases');
  }

  return diseases.length > 0 ? diseases : ['Upper Respiratory Tract Infection'];
}

/**
 * Default medicines based on conditions (fallback)
 */
function getDefaultMedicines(weather, aqi) {
  const medicines = [];

  if (aqi?.aqi > 100) {
    medicines.push('Albuterol Sulfate', 'Budesonide', 'Montelukast Sodium');
  }

  if (weather?.temperature > 35) {
    medicines.push('Oral Rehydration Solution (ORS)', 'Paracetamol', 'IV Fluids');
  } else if (weather?.temperature < 15) {
    medicines.push('Amoxicillin', 'Azithromycin', 'Dextromethorphan');
  }

  if (weather?.humidity > 80) {
    medicines.push('Clotrimazole', 'Miconazole Nitrate');
  }

  return medicines.length > 0 ? medicines : ['Paracetamol', 'Ibuprofen'];
}

/**
 * Chat with AI about diseases and medicines
 */
export async function chatAboutDiseaseMedicine(question, context = {}) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const model = geminiModel;

    const contextInfo = context.weather || context.aqi 
      ? `\n\nCurrent Conditions:\n${JSON.stringify(context, null, 2)}`
      : '';

    const prompt = `
You are a medical information assistant. Answer questions about diseases and medicines accurately and helpfully.

${contextInfo}

User Question: ${question}

Provide a clear, accurate answer. If asking about a specific disease or medicine, use proper medical terminology.
If you don't know something, say so clearly. Always prioritize accuracy and safety.
`;

    const result = await withRetry(
      async () => await model.generateContent(prompt),
      { maxRetries: 3, initialDelay: 2000, maxDelay: 60000 }
    );
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error in disease/medicine chat:', error);
    throw new Error(`Failed to get answer: ${error.message}`);
  }
}






