/**
 * Environment setup utility
 * Sets default values if not in .env
 */
export function setupEnvironmentDefaults() {
  // Set weather API key if not already set
  if (!process.env.WEATHER_API_KEY) {
    process.env.WEATHER_API_KEY = 'd3f36f311e87f456b2c011ac4475c83a';
    console.log('🌤️ Using default OpenWeatherMap API key');
  }

  // Log which APIs are configured
  console.log('\n📋 API Configuration:');
  console.log(`  Weather API: ${process.env.WEATHER_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  AQI API: ${process.env.AQI_API_URL ? '✅ Configured' : '❌ Using mock data'}`);
  console.log(`  Gemini API: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log('');
}









