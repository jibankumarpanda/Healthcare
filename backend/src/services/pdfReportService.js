import PDFDocument from 'pdfkit';
import { getPredictionHistory, getLatestPrediction } from './predictionService.js';
import { getAqiHistory, getWeatherHistory } from './dataService.js';

/**
 * Generate comprehensive PDF report
 */
export async function generatePDFReport(region, days = 30) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('MediOps Healthcare Prediction Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Region: ${region}`, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.text(`Report Period: Last ${days} days`, { align: 'center' });
      doc.moveDown(2);

      // Get latest prediction
      const prediction = await getLatestPrediction(region);
      
      if (prediction) {
        // Executive Summary
          doc.fontSize(16).text('Executive Summary', { underline: true });
          doc.moveDown();
          doc.fontSize(12);
          doc.text(`Surge Probability: ${prediction.surgeProbability}%`, { indent: 20 });
          doc.text(`Risk Level: ${
            prediction.surgeProbability > 70 ? 'High Risk' :
            prediction.surgeProbability > 40 ? 'Moderate Risk' : 'Low Risk'
          }`, { indent: 20 });
          
          if (prediction.estimatedPatientCount) {
            doc.text(`Estimated Patient Count: ${prediction.estimatedPatientCount}`, { indent: 20 });
          } else {
            doc.text(`Estimated Patient Count: ${Math.round(100 * (1 + prediction.surgeProbability / 100 * 0.5))}`, { indent: 20 });
          }
          
          doc.moveDown();

          // Staffing Recommendations
          doc.fontSize(16).text('Staffing Recommendations', { underline: true });
          doc.moveDown();
          doc.fontSize(12);
          if (prediction.staffAdvice) {
            doc.text(`Doctors Required: ${prediction.staffAdvice.doctors || 0}`, { indent: 20 });
            doc.text(`Nurses Required: ${prediction.staffAdvice.nurses || 0}`, { indent: 20 });
            doc.text(`Support Staff Required: ${prediction.staffAdvice.supportStaff || 0}`, { indent: 20 });
            if (prediction.staffAdvice.notes) {
              doc.text(`Notes: ${prediction.staffAdvice.notes}`, { indent: 20 });
            }
          }
          doc.moveDown();

          // Supply Recommendations
          doc.fontSize(16).text('Supply Recommendations', { underline: true });
          doc.moveDown();
          doc.fontSize(12);
          if (prediction.supplyAdvice) {
            doc.text(`Oxygen (Liters): ${prediction.supplyAdvice.oxygen || 0}`, { indent: 20 });
            doc.text(`PPE Units: ${prediction.supplyAdvice.ppe || 0}`, { indent: 20 });
            if (prediction.supplyAdvice.medicines && prediction.supplyAdvice.medicines.length > 0) {
              doc.text('Medicines:', { indent: 20 });
              prediction.supplyAdvice.medicines.forEach(medicine => {
                doc.text(`  • ${medicine}`, { indent: 40 });
              });
            }
            if (prediction.supplyAdvice.notes) {
              doc.text(`Notes: ${prediction.supplyAdvice.notes}`, { indent: 20 });
            }
          }
          doc.moveDown();

          // Suggested Diseases
          if (prediction.suggestedDiseases && prediction.suggestedDiseases.length > 0) {
            doc.fontSize(16).text('Potential Diseases', { underline: true });
            doc.moveDown();
            doc.fontSize(12);
            prediction.suggestedDiseases.forEach((disease, idx) => {
              doc.text(`${idx + 1}. ${disease}`, { indent: 20 });
            });
            doc.moveDown();
          }

          // Suggested Medicines
          if (prediction.suggestedMedicines && prediction.suggestedMedicines.length > 0) {
            doc.fontSize(16).text('Suggested Medicines', { underline: true });
            doc.moveDown();
            doc.fontSize(12);
            prediction.suggestedMedicines.forEach((medicine, idx) => {
              doc.text(`${idx + 1}. ${medicine}`, { indent: 20 });
            });
            doc.moveDown();
          }

          // Top Contributing Factors
          if (prediction.topFactors && prediction.topFactors.length > 0) {
            doc.fontSize(16).text('Top Contributing Factors', { underline: true });
            doc.moveDown();
            doc.fontSize(12);
            prediction.topFactors.forEach((factor, idx) => {
              doc.text(`${idx + 1}. ${factor.feature.replace('_', ' ').toUpperCase()}: ${(factor.impact * 100).toFixed(1)}%`, { indent: 20 });
            });
            doc.moveDown();
          }

          // Environmental Impact
          doc.fontSize(16).text('Environmental Impact', { underline: true });
          doc.moveDown();
          doc.fontSize(12);
          doc.text(`Weather Impact: ${prediction.weatherImpact || 'Normal conditions'}`, { indent: 20 });
          doc.text(`Air Quality Impact: ${prediction.aqiImpact || 'Normal air quality'}`, { indent: 20 });
          
          // Get history data
          try {
            const [history, aqiHistory, weatherHistory] = await Promise.all([
              getPredictionHistory(region, days),
              getAqiHistory(region, days),
              getWeatherHistory(region, days),
            ]);
            
            // Historical Data Summary
            doc.addPage();
            doc.fontSize(16).text('Historical Data Summary', { underline: true });
            doc.moveDown();
            doc.fontSize(12);
            
            if (history && history.length > 0) {
              doc.text(`Total Predictions: ${history.length}`, { indent: 20 });
              const avgSurge = history.reduce((sum, p) => sum + p.surgeProbability, 0) / history.length;
              doc.text(`Average Surge Probability: ${avgSurge.toFixed(1)}%`, { indent: 20 });
              doc.text(`Highest Surge: ${Math.max(...history.map(p => p.surgeProbability))}%`, { indent: 20 });
              doc.text(`Lowest Surge: ${Math.min(...history.map(p => p.surgeProbability))}%`, { indent: 20 });
            }
            
            doc.moveDown();
            
            if (aqiHistory && aqiHistory.length > 0) {
              doc.text('Air Quality Data:', { indent: 20 });
              const avgAqi = aqiHistory.reduce((sum, a) => sum + a.aqi, 0) / aqiHistory.length;
              doc.text(`  Average AQI: ${avgAqi.toFixed(1)}`, { indent: 40 });
              doc.text(`  Average PM2.5: ${(aqiHistory.reduce((sum, a) => sum + a.pm25, 0) / aqiHistory.length).toFixed(1)}`, { indent: 40 });
              doc.text(`  Average PM10: ${(aqiHistory.reduce((sum, a) => sum + a.pm10, 0) / aqiHistory.length).toFixed(1)}`, { indent: 40 });
            }
            
            doc.moveDown();
            
            if (weatherHistory && weatherHistory.length > 0) {
              doc.text('Weather Data:', { indent: 20 });
              doc.text(`  Average Temperature: ${(weatherHistory.reduce((sum, w) => sum + w.temperature, 0) / weatherHistory.length).toFixed(1)}°C`, { indent: 40 });
              doc.text(`  Average Humidity: ${(weatherHistory.reduce((sum, w) => sum + w.humidity, 0) / weatherHistory.length).toFixed(1)}%`, { indent: 40 });
            }

            // Footer
            doc.addPage();
            doc.fontSize(10).text('This report is generated by MediOps Healthcare Prediction System', { align: 'center' });
            doc.text('For questions or support, please contact your system administrator.', { align: 'center' });
            
            doc.end();
          } catch (err) {
            console.error('Error generating PDF:', err);
            doc.text('Error generating report. Please try again.', { align: 'center' });
            doc.end();
            reject(err);
          }
        } else {
          doc.text('No prediction data available for this region.', { align: 'center' });
          doc.end();
        }
    } catch (error) {
      reject(error);
    }
  });
}

