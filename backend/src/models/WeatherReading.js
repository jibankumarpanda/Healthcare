import mongoose from 'mongoose';

const weatherReadingSchema = new mongoose.Schema(
  {
    location: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
    humidity: {
      type: Number,
      required: true,
    },
    windSpeed: {
      type: Number,
      default: 0,
    },
    precipitation: {
      type: Number,
      default: 0,
    },
    raw: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

weatherReadingSchema.index({ location: 1, timestamp: -1 });

const WeatherReading = mongoose.model('WeatherReading', weatherReadingSchema);

export default WeatherReading;









