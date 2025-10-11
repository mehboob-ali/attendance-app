import * as svc from '../services/geofence.service.js';

export const getAll = async (req, res, next) => {
  try {
    const geofences = await svc.listGeofences();
    res.json(geofences);
  } catch (error) {
    next(error);
  }
};

export const postCreate = async (req, res, next) => {
  try {
    const geofence = await svc.createGeofence(req.body);
    res.status(201).json(geofence);
  } catch (error) {
    next(error);
  }
};

export const putUpdate = async (req, res, next) => {
  try {
    const geofence = await svc.updateGeofence(req.params.id, req.body);
    res.json(geofence);
  } catch (error) {
    next(error);
  }
};

export const delOne = async (req, res, next) => {
  try {
    await svc.removeGeofence(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
