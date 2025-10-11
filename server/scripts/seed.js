import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Geofence from '../src/models/Geofence.js';

dotenv.config();

await connectDB();

console.log('🌱 Seeding database...');

// Create admin user
const adminPassword = await bcrypt.hash('admin123', 10);
const admin = await User.create({
  name: 'Admin User',
  email: 'admin@attendance.com',
  passwordHash: adminPassword,
  role: 'admin'
});
console.log('✅ Created admin user');

// Create sample geofence (circle around a location)
const geofence = await Geofence.create({
  name: 'Mall Entrance A',
  type: 'circle',
  geometry: {
    type: 'Point',
    coordinates: [72.878176, 19.089340] // lng, lat - Mumbai Airport example
  },
  radiusMeters: 100,
  active: true
});
console.log('✅ Created sample geofence');

// Create sample employee
const empPassword = await bcrypt.hash('employee123', 10);
const employee = await User.create({
  name: 'John Doe',
  email: 'employee@attendance.com',
  passwordHash: empPassword,
  role: 'employee',
  sites: [geofence._id]
});
console.log('✅ Created sample employee');

console.log('\n📝 Login credentials:');
console.log('Admin: admin@attendance.com / admin123');
console.log('Employee: employee@attendance.com / employee123');

process.exit(0);
