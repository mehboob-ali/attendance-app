import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';

export async function register({ name, email, password, role = 'employee' }) {
  validatePasswordOrThrow(password);
  const existing = await User.findOne({ email });
  if (existing) {
    throw { status: 409, message: 'Email already registered' };
  }
  
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ 
    name, 
    email, 
    passwordHash, 
    role 
  });
  
  return { 
    id: user._id, 
    email: user.email,
    name: user.name,
    role: user.role
  };
}

export async function login({ email, password, mobileNumber }) {
  let user;
  
  // Allow login with either email or mobile number
  if (mobileNumber) {
    user = await User.findOne({ mobileNumber });
  } else if (email) {
    user = await User.findOne({ email });
  } else {
    throw { status: 400, message: 'Email or mobile number required' };
  }

  if (!user) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  // Check approval status
  if (user.approvalStatus === 'pending') {
    throw { 
      status: 403, 
      message: 'Your account is pending admin approval. Please wait for verification.' 
    };
  }

  if (user.approvalStatus === 'rejected') {
    throw { 
      status: 403, 
      message: `Your account was rejected. Reason: ${user.rejectionReason || 'Contact administrator'}` 
    };
  }

  if (!user.active) {
    throw { status: 401, message: 'Account is inactive' };
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  const token = jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      mobileNumber: user.mobileNumber
    }
  };
}


export async function createResetToken(email) {
  const user = await User.findOne({ email, active: true });
  if (!user) {
    throw { status: 404, message: 'User not found' };
  }
  
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
  
  user.resetToken = resetToken;
  user.resetTokenExpiry = resetTokenExpiry;
  await user.save();
  
  return resetToken;
}

export async function updatePassword(token, newPassword) {
  validatePasswordOrThrow(newPassword);
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: new Date() }
  });
  
  if (!user) {
    throw { status: 400, message: 'Invalid or expired reset token' };
  }
  
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();
}

function validatePasswordOrThrow(password) {
  if (typeof password !== 'string') {
    throw { status: 400, message: 'Password is required' };
  }
  // At least 8 chars, 1 letter, 1 number
  const okLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  if (!(okLength && hasLetter && hasNumber)) {
    throw { status: 400, message: 'Password must be at least 8 characters and include letters and numbers' };
  }
}


export async function employeeSignup(data) {
  const { 
    mobileNumber, 
    firstName, 
    middleName, 
    lastName, 
    gender, 
    dateOfBirth, 
    password 
  } = data;

  // Validate required fields
  if (!mobileNumber || !firstName || !lastName || !gender || !dateOfBirth || !password) {
    throw { status: 400, message: 'All required fields must be provided' };
  }

  // Validate mobile number format (10 digits)
  const mobileRegex = /^[0-9]{10}$/;
  if (!mobileRegex.test(mobileNumber)) {
    throw { status: 400, message: 'Mobile number must be 10 digits' };
  }

  // Validate age (must be 18+)
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (age < 18 || (age === 18 && monthDiff < 0)) {
    throw { status: 400, message: 'You must be at least 18 years old to register' };
  }

  // Check if mobile number already exists
  const existingUser = await User.findOne({ mobileNumber });
  
  if (existingUser) {
    if (existingUser.approvalStatus === 'pending') {
      throw { 
        status: 409, 
        message: 'Registration pending. Your account is awaiting admin approval.' 
      };
    } else if (existingUser.approvalStatus === 'approved') {
      throw { 
        status: 409, 
        message: 'Mobile number already registered. Please login.' 
      };
    } else if (existingUser.approvalStatus === 'rejected') {
      throw { 
        status: 403, 
        message: `Your registration was rejected. Reason: ${existingUser.rejectionReason || 'Contact administrator'}` 
      };
    }
  }

  // Validate password strength
  validatePasswordOrThrow(password);

  // Create user account with pending approval
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Generate email from mobile number (temporary)
  const email = `${mobileNumber}@pending.local`;
  
  // Construct full name
  const name = middleName 
    ? `${firstName} ${middleName} ${lastName}` 
    : `${firstName} ${lastName}`;

  const user = await User.create({
    mobileNumber,
    firstName,
    middleName,
    lastName,
    name,
    email,
    gender,
    dateOfBirth,
    passwordHash,
    role: 'employee',
    approvalStatus: 'pending',
    active: false
  });

  return {
    id: user._id,
    mobileNumber: user.mobileNumber,
    name: user.name,
    approvalStatus: user.approvalStatus,
    message: 'Registration successful! Your account is pending admin approval.'
  };
}
