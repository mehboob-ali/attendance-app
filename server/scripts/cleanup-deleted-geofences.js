import dotenv from 'dotenv';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Geofence from '../src/models/Geofence.js';

dotenv.config();

await connectDB();

console.log('🧹 Cleaning up deleted geofences from employee assignments...');

// Get all inactive geofences
const inactiveGeofences = await Geofence.find({ active: false }).select('_id');
const inactiveIds = inactiveGeofences.map(g => g._id);

console.log(`Found ${inactiveIds.length} inactive geofences`);

// Remove them from all users
const result = await User.updateMany(
  { sites: { $in: inactiveIds } },
  { $pull: { sites: { $in: inactiveIds } } }
);

console.log(`✅ Cleaned up ${result.modifiedCount} employees`);
console.log('Done!');

process.exit(0);
