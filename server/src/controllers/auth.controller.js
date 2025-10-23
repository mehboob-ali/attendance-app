import { register, login, createResetToken, updatePassword } from '../services/auth.service.js';

export const postRegister = async (req, res, next) => {
  try {
    const result = await register(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const postLogin = async (req, res, next) => {
  try {
    const result = await login(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};


import { employeeSignup } from '../services/auth.service.js';

export const postEmployeeSignup = async (req, res, next) => {
  try {
    const result = await employeeSignup(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};


export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    await createResetToken(email);
    // In production, send token via email. Do not expose in API response
    res.json({ 
      message: 'If that account exists, a reset email has been sent.'
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    await updatePassword(token, newPassword);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};
