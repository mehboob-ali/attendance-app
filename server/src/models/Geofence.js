import mongoose from 'mongoose';

const geofenceSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['polygon', 'circle'], 
    required: true 
  },
  geometry: { 
    type: { 
      type: String,
      enum: ['Point', 'Polygon'],
      required: true
    }, 
    coordinates: {
      type: [],
      required: true
    }
  },
  radiusMeters: { 
    type: Number,
    min: 0
  },
  active: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true 
});

geofenceSchema.index({ geometry: '2dsphere' });

export default mongoose.model('Geofence', geofenceSchema);
