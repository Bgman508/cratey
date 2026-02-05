import express from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// In-memory storage (replace with database in production)
const users = new Map();
const artists = new Map();

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, fullName, role = 'user' } = req.body;

    if (!email || !password || !fullName) {
      throw new AppError('Email, password, and full name are required', 400);
    }

    // Check if user exists
    for (const user of users.values()) {
      if (user.email === email.toLowerCase()) {
        throw new AppError('User already exists', 409);
      }
    }

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
      id: userId,
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName,
      role,
      createdAt: new Date().toISOString(),
      settings: {
        theme: 'dark',
        notifications: true,
        language: 'en',
      },
    };

    users.set(userId, newUser);

    // If registering as artist, create artist profile
    if (role === 'artist') {
      const artistId = uuidv4();
      artists.set(artistId, {
        id: artistId,
        userId: userId,
        name: fullName,
        slug: fullName.toLowerCase().replace(/\s+/g, '-'),
        bio: '',
        profileImage: null,
        bannerImage: null,
        socialLinks: {},
        thankYouNote: null,
        stripeConnected: false,
        stripeAccountId: null,
        totalSales: 0,
        totalRevenue: 0,
        createdAt: new Date().toISOString(),
      });
    }

    const token = generateToken(newUser);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        settings: newUser.settings,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    // Find user
    let user = null;
    for (const u of users.values()) {
      if (u.email === email.toLowerCase()) {
        user = u;
        break;
      }
    }

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
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

// Get current user
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Token required', 401);
    }

    import jwt from 'jsonwebtoken';
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = users.get(decoded.userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      settings: user.settings,
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Token required', 401);
    }

    import jwt from 'jsonwebtoken';
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = users.get(decoded.userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const newToken = generateToken(user);

    res.json({
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
export { users, artists };
