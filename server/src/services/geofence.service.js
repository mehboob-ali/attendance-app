import Geofence from '../models/Geofence.js';
import User from '../models/User.js';

export async function listGeofences() {
  return Geofence.find({ active: true }).lean();
}

export async function createGeofence(payload) {
  return Geofence.create(payload);
}

export async function updateGeofence(id, payload) {
  return Geofence.findByIdAndUpdate(id, payload, { new: true });
}

export async function removeGeofence(id) {
  // Mark geofence as inactive
  const geofence = await Geofence.findByIdAndUpdate(
    id, 
    { active: false }, 
    { new: true }
  );
  
  // Remove this geofence from all employee assignments
  await User.updateMany(
    { sites: id },
    { $pull: { sites: id } }
  );
  
  return geofence;
}
