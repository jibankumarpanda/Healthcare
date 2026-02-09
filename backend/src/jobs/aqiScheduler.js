import cron from 'node-cron';
import { fetchAndStoreAqi, fetchAndStoreWeather } from '../services/dataService.js';

// Default cities to update (can be overridden via environment variable)
const defaultCities = ['Delhi', 'Mumbai', 'Bangalore', 'Kolkata'];

/**
 * Schedule AQI and Weather updates every 6 hours
 */
export function startAqiScheduler() {
  console.log('🕐 Starting data scheduler - updates AQI and Weather every 6 hours');
  
  // Get cities from environment or use defaults
  const cities = process.env.SCHEDULED_CITIES 
    ? process.env.SCHEDULED_CITIES.split(',').map(c => c.trim())
    : defaultCities;
  
  // Run every 6 hours (at minute 0 of hours 0, 6, 12, 18)
  cron.schedule('0 */6 * * *', async () => {
    console.log(`\n🔄 Scheduled data update at ${new Date().toISOString()}`);
    
    try {
      // Update AQI and Weather for all cities (force fetch to bypass cache)
      const promises = cities.flatMap(city => [
        fetchAndStoreAqi(city, '', 'India', true).catch(err => {
          console.error(`❌ Error updating AQI for ${city}:`, err.message);
          return null;
        }),
        fetchAndStoreWeather(city, true).catch(err => {
          console.error(`❌ Error updating Weather for ${city}:`, err.message);
          return null;
        })
      ]);
      
      const results = await Promise.all(promises);
      const successCount = results.filter(r => r !== null).length;
      
      console.log(`✅ Data update completed: ${successCount}/${cities.length * 2} updates successful`);
    } catch (error) {
      console.error('Error in scheduled data update:', error);
    }
  });
  
  // Don't run immediately on startup - wait for first scheduled run or user input
  console.log(`📋 Scheduler configured for cities: ${cities.join(', ')}`);
  console.log(`⏰ Next update will run at the next 6-hour interval (00:00, 06:00, 12:00, or 18:00)`);
}


