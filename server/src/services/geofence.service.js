import Geofence from '../models/Geofence.js';

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
  return Geofence.findByIdAndUpdate(id, { active: false }, { new: true });
}
