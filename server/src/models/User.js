import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    unique: true, 
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['admin', 'employee'], 
    default: 'employee',
    index: true
  },
  sites: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Geofence' 
  }],
  active: {
    type: Boolean,
    default: true
  },
  resetToken: String,
  resetTokenExpiry: Date
}, { 
  timestamps: true 
});

const User = mongoose.model('User', userSchema);

export default User;
