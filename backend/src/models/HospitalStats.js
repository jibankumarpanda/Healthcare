import mongoose from 'mongoose';

const hospitalStatsSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: String,
      required: true,
      index: true,
    },
    region: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    admissions: {
      type: Number,
      default: 0,
    },
    icuBedsUsed: {
      type: Number,
      default: 0,
    },
    icuBedsAvailable: {
      type: Number,
      default: 0,
    },
    suppliesUsed: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

hospitalStatsSchema.index({ region: 1, date: -1 });
hospitalStatsSchema.index({ hospitalId: 1, date: -1 });

const HospitalStats = mongoose.model('HospitalStats', hospitalStatsSchema);

export default HospitalStats;









