import mongoose from 'mongoose';

const exceptionSchema = new mongoose.Schema({
  punchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Punch'
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  decision: { 
    type: String, 
    enum: ['pending', 'approved', 'denied'], 
    default: 'pending',
    index: true
  },
  comment: String,
  decidedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  decidedAt: Date
}, { 
  timestamps: true 
});

export default mongoose.model('Exception', exceptionSchema);
