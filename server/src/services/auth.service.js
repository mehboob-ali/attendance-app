import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';

export async function register({ name, email, password, role = 'employee' }) {
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

export async function login({ email, password }) {
  const user = await User.findOne({ email, active: true });
  if (!user) {
    throw { status: 401, message: 'Invalid credentials' };
  }
  
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw { status: 401, message: 'Invalid credentials' };
  }
  
  const token = jwt.sign(
    { 
      sub: user._id, 
      role: user.role, 
      email: user.email 
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '8h' }
  );
  
  return { 
    token, 
    user: { 
      id: user._id, 
      name: user.name, 
      role: user.role, 
      email: user.email,
      sites: user.sites
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
