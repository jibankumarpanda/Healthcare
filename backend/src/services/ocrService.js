import vision from '@google-cloud/vision';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Google Cloud Vision client
let visionClient;

try {
  // Check if credentials file exists or use environment variable
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    visionClient = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  } else if (process.env.GOOGLE_CLOUD_VISION_API_KEY) {
    visionClient = new vision.ImageAnnotatorClient({
      apiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY,
    });
  } else {
    console.warn('⚠️  Google Cloud Vision credentials not configured');
  }
} catch (error) {
  console.error('Error initializing Google Cloud Vision:', error.message);
}

/**
 * Extract text from PDF using Google Cloud Vision OCR
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<Object>} OCR results with text and confidence
 */
export const extractTextFromPDF = async (filePath) => {
  try {
    if (!visionClient) {
      throw new Error('Google Cloud Vision client not initialized. Please configure credentials.');
    }

    // Read the PDF file
    const fileBuffer = await fs.readFile(filePath);

    // Perform OCR on the PDF
    const [result] = await visionClient.documentTextDetection({
      image: { content: fileBuffer },
    });

    const fullTextAnnotation = result.fullTextAnnotation;

    if (!fullTextAnnotation) {
      return {
        text: '',
        confidence: 0,
        pages: 0,
        language: 'unknown',
      };
    }

    // Extract text and calculate average confidence
    const text = fullTextAnnotation.text || '';
    const pages = fullTextAnnotation.pages || [];
    
    let totalConfidence = 0;
    let wordCount = 0;

    pages.forEach(page => {
      page.blocks?.forEach(block => {
        block.paragraphs?.forEach(paragraph => {
          paragraph.words?.forEach(word => {
            if (word.confidence) {
              totalConfidence += word.confidence;
              wordCount++;
            }
          });
        });
      });
    });

    const averageConfidence = wordCount > 0 ? totalConfidence / wordCount : 0;

    // Detect language
    const detectedLanguages = pages[0]?.property?.detectedLanguages || [];
    const primaryLanguage = detectedLanguages[0]?.languageCode || 'en';

    return {
      text: text.trim(),
      confidence: Math.round(averageConfidence * 100),
      pages: pages.length,
      language: primaryLanguage,
      wordCount,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
};

/**
 * Extract entities and structured data from OCR text
 * @param {string} text - Extracted text from OCR
 * @returns {Object} Extracted entities and structured data
 */
export const extractEntities = (text) => {
  const entities = {
    dates: [],
    emails: [],
    phones: [],
    medicalTerms: [],
    numbers: [],
  };

  // Extract dates (various formats)
  const dateRegex = /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g;
  entities.dates = text.match(dateRegex) || [];

  // Extract emails
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  entities.emails = text.match(emailRegex) || [];

  // Extract phone numbers
  const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/g;
  entities.phones = text.match(phoneRegex) || [];

  // Extract common medical terms (basic example)
  const medicalKeywords = [
    'patient', 'diagnosis', 'treatment', 'prescription', 'medication',
    'blood pressure', 'temperature', 'heart rate', 'symptoms', 'doctor',
    'hospital', 'clinic', 'test', 'result', 'report'
  ];
  
  medicalKeywords.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    if (regex.test(text)) {
      entities.medicalTerms.push(term);
    }
  });

  // Extract numbers (could be measurements, values, etc.)
  const numberRegex = /\b\d+\.?\d*\b/g;
  const numbers = text.match(numberRegex) || [];
  entities.numbers = numbers.slice(0, 20); // Limit to first 20 numbers

  return entities;
};
