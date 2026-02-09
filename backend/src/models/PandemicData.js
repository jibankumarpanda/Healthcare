import mongoose from 'mongoose';

const pandemicDataSchema = new mongoose.Schema(
  {
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
    diseaseName: {
      type: String,
      required: true,
      index: true,
    },
    activeCases: {
      type: Number,
      default: 0,
    },
    newCases: {
      type: Number,
      default: 0,
    },
    recovered: {
      type: Number,
      default: 0,
    },
    deaths: {
      type: Number,
      default: 0,
    },
    severity: {
      type: String,
      enum: ['low', 'moderate', 'high', 'critical'],
      default: 'low',
    },
    transmissionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    affectedAgeGroups: [String],
    symptoms: [String],
    requiredMedicines: [String],
    notes: String,
    source: {
      type: String,
      default: 'system',
    },
  },
  {
    timestamps: true,
  }
);

pandemicDataSchema.index({ region: 1, date: -1 });
pandemicDataSchema.index({ diseaseName: 1, date: -1 });
pandemicDataSchema.index({ region: 1, diseaseName: 1, date: -1 });

const PandemicData = mongoose.model('PandemicData', pandemicDataSchema);

export default PandemicData;







