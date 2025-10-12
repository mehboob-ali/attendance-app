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

export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    const resetToken = await createResetToken(email);
    // In production, send this via email
    res.json({ 
      message: 'Reset token generated',
      resetToken // Remove this in production, send via email only
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
