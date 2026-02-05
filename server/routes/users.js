import express from 'express';
import bcrypt from 'bcryptjs';
import { AppError } from '../middleware/errorHandler.js';
import { users } from './auth.js';

const router = express.Router();

// Get user profile
router.get('/profile', (req, res) => {
  const user = users.get(req.userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    createdAt: user.createdAt,
    settings: user.settings,
  });
});

// Update user profile
router.patch('/profile', async (req, res, next) => {
  try {
    const user = users.get(req.userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { fullName, email } = req.body;
    
    if (fullName) user.fullName = fullName;
    if (email) user.email = email.toLowerCase();

    users.set(req.userId, user);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        settings: user.settings,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.post('/change-password', async (req, res, next) => {
  try {
    const user = users.get(req.userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    users.set(req.userId, user);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

// Get user settings
router.get('/settings', (req, res) => {
  const user = users.get(req.userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json(user.settings);
});

// Update user settings
router.patch('/settings', (req, res) => {
  const user = users.get(req.userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.settings = { ...user.settings, ...req.body };
  users.set(req.userId, user);

  res.json({
    message: 'Settings updated successfully',
    settings: user.settings,
  });
});

export default router;
