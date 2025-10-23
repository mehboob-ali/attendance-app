import mongoose from 'mongoose';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the server root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrateUsers() {
  try {
    // Use MONGO_URI (your actual env variable name)
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined in .env file. Please check your server/.env file.");
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Update all existing users to approved status (if they don't have approvalStatus)
    const result = await User.updateMany(
      { 
        $or: [
          { approvalStatus: { $exists: false } },
          { approvalStatus: null }
        ]
      },
      { 
        $set: { 
          approvalStatus: 'approved',
          approvedAt: new Date()
        } 
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} users to approved status`);

    // List all users and their status
    const allUsers = await User.find({})
      .select('name email mobileNumber role approvalStatus active')
      .lean();

    console.log(`\n📊 Total users in database: ${allUsers.length}\n`);
    
    console.log('👥 All Users:');
    console.log('─'.repeat(80));
    allUsers.forEach(u => {
      const mobile = u.mobileNumber || 'N/A';
      const status = u.approvalStatus || 'N/A';
      const active = u.active ? '✓' : '✗';
      console.log(`${active} ${u.name.padEnd(25)} | ${u.role.padEnd(10)} | ${status.padEnd(10)} | ${mobile}`);
    });
    console.log('─'.repeat(80));

    // List users without mobile numbers
    const usersWithoutMobile = await User.find({ 
      $or: [
        { mobileNumber: { $exists: false } },
        { mobileNumber: null },
        { mobileNumber: '' }
      ]
    }).select('name email role');

    if (usersWithoutMobile.length > 0) {
      console.log(`\nℹ️  ${usersWithoutMobile.length} users without mobile numbers:`);
      usersWithoutMobile.forEach(u => {
        console.log(`  - ${u.name} (${u.email}) - ${u.role}`);
      });
      console.log('\n💡 These users can still login with their email addresses.');
    } else {
      console.log('\n✅ All users have mobile numbers assigned.');
    }

    await mongoose.connection.close();
    console.log('\n✅ Migration complete. Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration error:', error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

migrateUsers();
