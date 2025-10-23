import * as turf from '@turf/turf';

export function isInsidePolygon(point, polygon) {
  const turfPoint = turf.point(point);
  return turf.booleanPointInPolygon(turfPoint, polygon);
}

export function distanceMeters(pointA, pointB) {
  const from = turf.point(pointA);
  const to = turf.point(pointB);
  // turf.distance returns kilometers by default; request km and convert to meters
  const km = turf.distance(from, to, { units: 'kilometers' });
  return km * 1000;
}

export function isInsideCircle(point, center, radiusMeters) {
  const distance = distanceMeters(point, center);
  return distance <= radiusMeters;
}
