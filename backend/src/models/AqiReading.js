import mongoose from 'mongoose';

const aqiReadingSchema = new mongoose.Schema(
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
    aqi: {
      type: Number,
      required: true,
    },
    pm25: {
      type: Number,
      default: 0,
    },
    pm10: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      default: 'api',
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

aqiReadingSchema.index({ location: 1, timestamp: -1 });

const AqiReading = mongoose.model('AqiReading', aqiReadingSchema);

export default AqiReading;









