import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs/promises';
import { withRetry } from '../utils/geminiRetry.js';
import { model as geminiModel, GEMINI_MODEL, genAI } from '../utils/geminiConfig.js';

/**
 * Extract text from PDF using pdfjs-dist
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<Object>} - Extracted text and metadata
 */
export async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = new Uint8Array(dataBuffer);
    
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdfDocument = await loadingTask.promise;
    
    const numPages = pdfDocument.numPages;
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    const metadata = await pdfDocument.getMetadata();

    return {
      text: fullText.trim(),
      pages: numPages,
      info: metadata.info,
      metadata: metadata.metadata,
    };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Analyze PDF content using Gemini 2.5 Flash
 * @param {string} text - Extracted text from PDF
 * @returns {Promise<Object>} - Analysis results from Gemini
 */
export async function analyzePDFWithGemini(text) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const model = geminiModel;

    const prompt = `
You are a medical document analysis assistant. Analyze the following medical document text and extract structured information.

Please provide:
1. Document Type (e.g., Lab Report, Prescription, Medical Record, Insurance Document, etc.)
2. Key Medical Information:
   - Patient details (if available)
   - Medical conditions or diagnoses
   - Medications mentioned
   - Test results and values
   - Dates and appointments
3. Important Medical Terms and their context
4. Summary of the document
5. Any critical findings or alerts

Document Text:
${text}

Please provide the response in a structured JSON format with the following keys:
- documentType
- patientInfo (object with name, age, gender, id if available)
- medicalConditions (array)
- medications (array with name, dosage, frequency if available)
- testResults (array with test name, value, unit, reference range if available)
- dates (array of important dates with context)
- medicalTerms (array of important medical terms with brief explanation)
- summary (brief summary of the document)
- criticalFindings (array of any urgent or critical information)
- confidence (your confidence level in the analysis: high/medium/low)
`;

    const result = await withRetry(
      async () => await model.generateContent(prompt),
      { maxRetries: 3, initialDelay: 2000, maxDelay: 60000 }
    );
    const response = await result.response;
    const analysisText = response.text();

    // Try to parse JSON from the response
    let analysis;
    try {
      // Remove markdown code blocks if present
      const jsonText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(jsonText);
    } catch (parseError) {
      // If JSON parsing fails, return the raw text
      console.warn('Could not parse Gemini response as JSON, returning raw text');
      analysis = {
        rawAnalysis: analysisText,
        documentType: 'Unknown',
        summary: analysisText.substring(0, 500),
        confidence: 'low',
      };
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing PDF with Gemini:', error);
    throw new Error(`Gemini analysis failed: ${error.message}`);
  }
}

/**
 * Process PDF file: Extract text and analyze with Gemini
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<Object>} - Complete processing results
 */
export async function processPDFWithGemini(filePath) {
  try {
    console.log(' Extracting text from PDF...');
    const pdfData = await extractTextFromPDF(filePath);

    if (!pdfData.text || pdfData.text.trim().length === 0) {
      throw new Error('No text could be extracted from the PDF');
    }

    console.log(' Analyzing content with Gemini AI...');
    const analysis = await analyzePDFWithGemini(pdfData.text);

    return {
      extractedText: pdfData.text,
      pageCount: pdfData.pages,
      pdfMetadata: pdfData.info,
      geminiAnalysis: analysis,
      processingDate: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error processing PDF with Gemini:', error);
    throw error;
  }
}

/**
 * Ask a question about the PDF content using Gemini
 * @param {string} text - Extracted text from PDF
 * @param {string} question - User's question
 * @returns {Promise<string>} - Answer from Gemini
 */
export async function askQuestionAboutPDF(text, question) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const model = geminiModel;

    const prompt = `
You are a medical document assistant. Based on the following medical document, please answer the user's question accurately and concisely.

Document Text:
${text}

User Question: ${question}

Please provide a clear, accurate answer based only on the information in the document. If the information is not available in the document, please state that clearly.
`;

    const result = await withRetry(
      async () => await model.generateContent(prompt),
      { maxRetries: 3, initialDelay: 2000, maxDelay: 60000 }
    );
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error asking question with Gemini:', error);
    throw new Error(`Failed to get answer: ${error.message}`);
  }
}

/**
 * Run the MediOps AI operations agent
 * @param {string} message - User prompt/question
 * @param {Object} context - Optional structured context (region, timeframe, metrics, etc.)
 * @returns {Promise<Object>} Structured AI response
 */
export async function runOperationsAgent(message, context = {}) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const model = geminiModel;

    const contextBlock = typeof context === 'string'
      ? context
      : JSON.stringify(context || {}, null, 2);

    const prompt = `
You are MediOps AI, an operations-focused healthcare copilot. Provide concise, actionable insights for hospital admins.

Output MUST be valid JSON with keys:
{
  "summary": string,
  "surgeProbabilityInsight": string,
  "staffingPlan": string,
  "supplyPlan": string,
  "suggestedActions": string[],
  "suggestedMedicines": string[],
  "suggestedDiseases": string[],
  "weatherImpact": string,
  "aqiImpact": string,
  "confidence": "high" | "medium" | "low"
}

Based on the context data (AQI, weather, surge probability), suggest:
- Medicines that may be needed (e.g., for respiratory issues if AQI is high, ORS for heat, antibiotics for cold weather)
- Diseases that may spike (e.g., respiratory infections for high AQI, heat stroke for high temperature, flu for cold weather)

Context (may be empty):
${contextBlock}

User Message:
${message}
`;

    const result = await withRetry(
      async () => await model.generateContent(prompt),
      { maxRetries: 3, initialDelay: 2000, maxDelay: 60000 }
    );
    const response = await result.response;
    const rawText = response.text().trim();

    let parsed;
    try {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.warn('AI agent returned non-JSON payload, falling back to plain text.');
      parsed = {
        summary: rawText,
        surgeProbabilityInsight: 'Not provided',
        staffingPlan: 'Not provided',
        supplyPlan: 'Not provided',
        suggestedActions: [],
        confidence: 'low',
      };
    }

    return {
      ...parsed,
      modelVersion: GEMINI_MODEL,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('runOperationsAgent error:', error);
    throw new Error(`AI agent failed: ${error.message}`);
  }
}
