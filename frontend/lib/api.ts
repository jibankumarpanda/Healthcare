const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export interface Document {
  _id: string;
  userId: string;
  userEmail: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  ocrText: string;
  ocrConfidence: number;
  extractedData: {
    documentType?: string;
    patientInfo?: {
      name?: string;
      age?: string | number;
      gender?: string;
      id?: string;
    };
    medicalConditions?: string[];
    medications?: {
      name?: string;
      dosage?: string;
      frequency?: string;
    }[];
    testResults?: {
      testName?: string;
      value?: string | number;
      unit?: string;
      referenceRange?: string;
    }[];
    dates?: Array<string | { date?: string; context?: string }>;
    emails?: string[];
    phones?: string[];
    medicalTerms?: Array<string | { term?: string; explanation?: string }>;
    numbers?: Array<string | number>;
    summary?: string;
    criticalFindings?: string[];
    confidence?: string;
    [key: string]: any;
  };
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  metadata: {
    pageCount?: number;
    language?: string;
    detectedEntities?: string[];
    pdfMetadata?: any;
    processingDate?: string;
    aiModel?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface DocumentsResponse {
  documents: Document[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Fetch all documents for the authenticated user
 */
export async function getDocuments(
  token: string,
  params?: {
    status?: string;
    limit?: number;
    page?: number;
  }
): Promise<ApiResponse<DocumentsResponse>> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.page) queryParams.append('page', params.page.toString());

  const url = `${API_URL}/api/documents${queryParams.toString() ? `?${queryParams}` : ''}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}

/**
 * Fetch a specific document by ID
 */
export async function getDocument(
  token: string,
  documentId: string
): Promise<ApiResponse<Document>> {
  const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}

/**
 * Delete a document
 */
export async function deleteDocument(
  token: string,
  documentId: string
): Promise<ApiResponse<void>> {
  const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}

export interface AgentChatResponse {
  summary: string;
  surgeProbabilityInsight?: string;
  staffingPlan?: string;
  supplyPlan?: string;
  suggestedActions?: string[];
  suggestedMedicines?: string[];
  suggestedDiseases?: string[];
  weatherImpact?: string;
  aqiImpact?: string;
  confidence?: string;
  modelVersion?: string;
  generatedAt?: string;
}

export interface Prediction {
  _id: string;
  region: string;
  date: string;
  surgeProbability: number;
  estimatedPatientCount?: number;
  modelVersion: string;
  staffAdvice: {
    doctors: number;
    nurses: number;
    supportStaff: number;
    notes: string;
  };
  supplyAdvice: {
    oxygen: number;
    medicines: string[];
    ppe: number;
    notes: string;
  };
  topFactors: Array<{ feature: string; impact: number }>;
  suggestedMedicines: string[];
  suggestedDiseases: string[];
  activePandemics?: Array<{
    diseaseName: string;
    activeCases: number;
    newCases: number;
    severity: string;
    transmissionRate: number;
  }>;
  weatherImpact: string;
  aqiImpact: string;
}

export interface AqiReading {
  _id: string;
  location: string;
  timestamp: string;
  aqi: number;
  pm25: number;
  pm10: number;
}

export interface WeatherReading {
  _id: string;
  location: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
}

export async function runAgentChat(
  token: string,
  payload: {
    message: string;
    context?: Record<string, unknown>;
  }
): Promise<ApiResponse<AgentChatResponse>> {
  const response = await fetch(`${API_URL}/api/agent/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}

/**
 * Get latest prediction with real-time data
 */
export async function getLatestPrediction(
  token: string,
  city: string
): Promise<ApiResponse<{ prediction: Prediction; aqi: AqiReading; weather: WeatherReading }>> {
  if (!city) {
    throw new Error('City name is required');
  }
  const response = await fetch(`${API_URL}/api/predictions/latest?city=${encodeURIComponent(city)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}

/**
 * Generate a new prediction
 */
export async function generatePrediction(
  token: string,
  city: string,
  date?: string
): Promise<ApiResponse<Prediction>> {
  if (!city) {
    throw new Error('City name is required');
  }
  const response = await fetch(`${API_URL}/api/predictions/predict`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ city, date }),
  });

  return response.json();
}

/**
 * Get prediction history
 */
export async function getPredictionHistory(
  token: string,
  city: string,
  days: number = 30
): Promise<ApiResponse<Prediction[]>> {
  if (!city) {
    throw new Error('City name is required');
  }
  const response = await fetch(`${API_URL}/api/predictions/history?city=${encodeURIComponent(city)}&days=${days}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}

/**
 * Download prediction data
 */
export async function downloadPredictions(
  token: string,
  city: string,
  days: number = 30
): Promise<Blob> {
  if (!city) {
    throw new Error('City name is required');
  }
  const response = await fetch(`${API_URL}/api/predictions/download?city=${encodeURIComponent(city)}&days=${days}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Download failed');
  }

  return response.blob();
}

/**
 * Chat about diseases and medicines
 */
export async function chatDiseaseMedicine(
  token: string,
  question: string,
  city?: string
): Promise<ApiResponse<{ question: string; answer: string; context: any }>> {
  const response = await fetch(`${API_URL}/api/disease-medicine/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question, city }),
  });

  return response.json();
}
