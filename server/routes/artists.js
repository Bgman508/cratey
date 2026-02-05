import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middleware/errorHandler.js';
import { authenticateToken, requireArtist } from '../middleware/auth.js';
import { artists, users } from './auth.js';
import { products } from './products.js';

const router = express.Router();

// List all artists
router.get('/', (req, res) => {
  const { search, sort = '-totalSales', limit = 20 } = req.query;

  let result = [];

  for (const artist of artists.values()) {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        artist.name?.toLowerCase().includes(searchLower) ||
        artist.bio?.toLowerCase().includes(searchLower);
      if (!matchesSearch) continue;
    }

    // Get artist's products
    const artistProducts = [];
    for (const product of products.values()) {
      if (product.artist_id === artist.id) {
        artistProducts.push(product);
      }
    }

    result.push({
      ...artist,
      productCount: artistProducts.length,
    });
  }

  // Sorting
  const sortField = sort.replace('-', '');
  const sortDesc = sort.startsWith('-');
  result.sort((a, b) => {
    let aVal = a[sortField] || 0;
    let bVal = b[sortField] || 0;
    return sortDesc ? bVal - aVal : aVal - bVal;
  });

  res.json({
    artists: result.slice(0, parseInt(limit)),
    total: result.length,
  });
});

// Get single artist by slug
router.get('/slug/:slug', (req, res) => {
  let artist = null;
  for (const a of artists.values()) {
    if (a.slug === req.params.slug) {
      artist = a;
      break;
    }
  }

  if (!artist) {
    throw new AppError('Artist not found', 404);
  }

  // Get artist's products
  const artistProducts = [];
  for (const product of products.values()) {
    if (product.artist_id === artist.id && product.status === 'active') {
      artistProducts.push(product);
    }
  }

  // Sort products by creation date
  artistProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    ...artist,
    products: artistProducts,
  });
});

// Get single artist by ID
router.get('/:id', (req, res) => {
  const artist = artists.get(req.params.id);

  if (!artist) {
    throw new AppError('Artist not found', 404);
  }

  // Get artist's products
  const artistProducts = [];
  for (const product of products.values()) {
    if (product.artist_id === artist.id && product.status === 'active') {
      artistProducts.push(product);
    }
  }

  res.json({
    ...artist,
    products: artistProducts,
  });
});

// Update artist profile (artist only)
router.patch('/profile', authenticateToken, requireArtist, (req, res) => {
  let artist = null;
  for (const a of artists.values()) {
    if (a.userId === req.userId) {
      artist = a;
      break;
    }
  }

  if (!artist) {
    throw new AppError('Artist profile not found', 404);
  }

  const updates = req.body;
  const allowedFields = [
    'name', 'bio', 'profileImage', 'bannerImage', 
    'socialLinks', 'thankYouNote'
  ];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      artist[field] = updates[field];
    }
  }

  // Update slug if name changed
  if (updates.name) {
    artist.slug = updates.name.toLowerCase().replace(/\s+/g, '-');
  }

  artist.updatedAt = new Date().toISOString();
  artists.set(artist.id, artist);

  res.json({
    message: 'Artist profile updated successfully',
    artist,
  });
});

// Sign up as artist
router.post('/signup', authenticateToken, async (req, res, next) => {
  try {
    // Check if user is already an artist
    for (const a of artists.values()) {
      if (a.userId === req.userId) {
        throw new AppError('User is already an artist', 409);
      }
    }

    const user = users.get(req.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Update user role
    user.role = 'artist';
    users.set(req.userId, user);

    // Create artist profile
    const artistId = uuidv4();
    const { name, bio } = req.body;
    
    const newArtist = {
      id: artistId,
      userId: req.userId,
      name: name || user.fullName,
      slug: (name || user.fullName).toLowerCase().replace(/\s+/g, '-'),
      bio: bio || '',
      profileImage: null,
      bannerImage: null,
      socialLinks: {},
      thankYouNote: null,
      stripeConnected: false,
      stripeAccountId: null,
      totalSales: 0,
      totalRevenue: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    artists.set(artistId, newArtist);

    res.status(201).json({
      message: 'Artist profile created successfully',
      artist: newArtist,
    });
  } catch (error) {
    next(error);
  }
});

// Get artist dashboard stats
router.get('/dashboard/stats', authenticateToken, requireArtist, (req, res) => {
  let artist = null;
  for (const a of artists.values()) {
    if (a.userId === req.userId) {
      artist = a;
      break;
    }
  }

  if (!artist) {
    throw new AppError('Artist profile not found', 404);
  }

  // Get artist's products
  const artistProducts = [];
  for (const product of products.values()) {
    if (product.artist_id === artist.id) {
      artistProducts.push(product);
    }
  }

  // Calculate stats
  const totalProducts = artistProducts.length;
  const totalSales = artistProducts.reduce((sum, p) => sum + (p.total_sales || 0), 0);
  const totalRevenue = artistProducts.reduce((sum, p) => sum + (p.total_revenue_cents || 0), 0);
  const totalViews = artistProducts.reduce((sum, p) => sum + (p.view_count || 0), 0);

  res.json({
    totalProducts,
    totalSales,
    totalRevenue,
    totalViews,
    stripeConnected: artist.stripeConnected,
  });
});

export default router;
