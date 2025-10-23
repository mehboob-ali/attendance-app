import mongoose from 'mongoose';

const punchSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  type: { 
    type: String, 
    enum: ['in', 'out'], 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  accuracy: {
    type: Number,
    required: true
  },
  permissionState: String,
  ipGeo: {
    type: Object,
    default: {}
  },
  status: { 
    type: String, 
    enum: ['approved', 'pending', 'denied'], 
    default: 'approved',
    index: true
  }
}, { 
  timestamps: true 
});

punchSchema.index({ location: '2dsphere' });
punchSchema.index({ userId: 1, timestamp: -1 });

export default mongoose.model('Punch', punchSchema);
