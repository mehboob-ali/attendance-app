import Punch from "../models/Punch.js";
import Geofence from "../models/Geofence.js";
import User from "../models/User.js";
import Exception from "../models/Exception.js";
import { lookupIP } from "../utils/ipGeo.js";
import * as turf from "@turf/turf";

export async function validateAndPunch(user, body, req) {
  const { type, coords, permissionState } = body;

  if (!["in", "out"].includes(type)) {
    throw { status: 400, message: "Invalid punch type" };
  }

  if (!coords || !coords.lat || !coords.lng || coords.accuracy == null) {
    throw { status: 400, message: "Missing or invalid coordinates" };
  }

  const { lat, lng, accuracy } = coords;

  // Add coordinate validation
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw {
      status: 400,
      message:
        "Invalid coordinates: latitude must be -90 to 90, longitude must be -180 to 180",
    };
  }
  
  if (accuracy < 0) {
    throw { status: 400, message: "Invalid accuracy value" };
  }
  const accuracyMax = parseInt(process.env.ACCURACY_MAX || "100");

  if (accuracy > accuracyMax) {
    throw {
      status: 400,
      message: `Accuracy too low (${Math.round(
        accuracy
      )}m). Required: ≤${accuracyMax}m`,
    };
  }

  // Check if user has already punched today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dailyPunches = await Punch.find({
    userId: user.sub,
    timestamp: { $gte: today, $lt: tomorrow },
    status: "approved",
  }).sort({ timestamp: "asc" });

  const hasPunchedIn = dailyPunches.find((p) => p.type === "in");
  const hasPunchedOut = dailyPunches.find((p) => p.type === "out");

  if (type === "in") {
    if (hasPunchedIn) {
      throw {
        status: 400,
        message: `You have already punched in today at ${hasPunchedIn.timestamp.toLocaleTimeString()}.`,
      };
    }
  } else if (type === "out") {
    if (!hasPunchedIn) {
      throw {
        status: 400,
        message: "You must punch in before you can punch out.",
      };
    }
    if (hasPunchedOut) {
      throw {
        status: 400,
        message: `You have already punched out today at ${hasPunchedOut.timestamp.toLocaleTimeString()}.`,
      };
    }
  }

  // Fetch user's assigned sites
  const userData = await User.findById(user.sub).lean();
  if (!userData) {
    throw { status: 404, message: "User not found" };
  }

  const fences = await Geofence.find({
    _id: { $in: userData.sites || [] },
    active: true,
  }).lean();

  if (fences.length === 0) {
    throw {
      status: 400,
      message: "No work areas assigned to you. Contact your administrator.",
    };
  }

  const point = turf.point([lng, lat]);
  let inside = false;

  for (const fence of fences) {
    if (fence.type === "polygon" && fence.geometry?.type === "Polygon") {
      inside = turf.booleanPointInPolygon(point, fence.geometry);
    } else if (
      fence.type === "circle" &&
      fence.geometry?.type === "Point" &&
      fence.radiusMeters
    ) {
      const centerPoint = turf.point(fence.geometry.coordinates);
      // turf.distance returns kilometers by default; convert to meters
      const distanceKm = turf.distance(point, centerPoint, {
        units: "kilometers",
      });
      const distanceMeters = distanceKm * 1000;
      // inside = distanceMeters <= fence.radiusMeters;
      inside = distanceMeters + accuracy <= fence.radiusMeters;
    }

    if (inside) break;
  }

  if (!inside) {
    // Create exception for out-of-geofence attempt
    const punch = await Punch.create({
      userId: user.sub,
      type,
      location: { type: "Point", coordinates: [lng, lat] },
      accuracy,
      permissionState,
      ipGeo: await lookupIP(req),
      status: "pending",
    });

    await Exception.create({
      punchId: punch._id,
      userId: user.sub,
      reason: "Outside geofence boundary",
      decision: "pending",
    });

    throw {
      status: 400,
      message: "Outside geofence. Exception created for approval.",
    };
  }

  const ipGeo = await lookupIP(req);

  const punch = await Punch.create({
    userId: user.sub,
    type,
    location: { type: "Point", coordinates: [lng, lat] },
    accuracy,
    permissionState,
    ipGeo,
    status: "approved",
  });

  return punch;
}

export async function getUserPunches(userId, { startDate, endDate } = {}) {
  const query = { userId };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  return Punch.find(query).sort({ timestamp: -1 }).lean();
}
