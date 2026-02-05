import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middleware/errorHandler.js';
import { authenticateToken, optionalAuth, requireArtist } from '../middleware/auth.js';
import { artists } from './auth.js';

const router = express.Router();

// In-memory storage
const products = new Map();

// List products with filters
router.get('/', optionalAuth, (req, res) => {
  const { 
    artist_id, 
    genre, 
    edition_type, 
    search, 
    sort = '-createdAt',
    limit = 20,
    page = 1
  } = req.query;

  let result = [];

  for (const product of products.values()) {
    // Apply filters
    if (artist_id && product.artist_id !== artist_id) continue;
    if (genre && !product.genres?.includes(genre)) continue;
    if (edition_type && product.edition_type !== edition_type) continue;
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        product.title?.toLowerCase().includes(searchLower) ||
        product.artist_name?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.tags?.some(tag => tag.toLowerCase().includes(searchLower));
      if (!matchesSearch) continue;
    }

    result.push(product);
  }

  // Sorting
  const sortField = sort.replace('-', '');
  const sortDesc = sort.startsWith('-');
  result.sort((a, b) => {
    let aVal = a[sortField] || 0;
    let bVal = b[sortField] || 0;
    if (sortField === 'createdAt') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    return sortDesc ? bVal - aVal : aVal - bVal;
  });

  // Pagination
  const total = result.length;
  const start = (page - 1) * limit;
  const paginated = result.slice(start, start + parseInt(limit));

  res.json({
    products: paginated,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
  });
});

// Get single product
router.get('/:id', optionalAuth, (req, res) => {
  const product = products.get(req.params.id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Increment view count
  product.view_count = (product.view_count || 0) + 1;
  products.set(req.params.id, product);

  res.json(product);
});

// Create product (artist only)
router.post('/', authenticateToken, requireArtist, (req, res) => {
  const {
    title,
    description,
    price_cents,
    archive_price_cents,
    genres,
    tags,
    edition_type,
    edition_limit,
    edition_name,
    bundle_discount_percent,
    drop_window_enabled,
    drop_window_end,
    cover_url,
    audio_urls,
    track_names,
    track_durations,
    bpm,
    key,
  } = req.body;

  if (!title || !price_cents) {
    throw new AppError('Title and price are required', 400);
  }

  // Get artist for this user
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

  const productId = uuidv4();
  const newProduct = {
    id: productId,
    artist_id: artist.id,
    artist_name: artist.name,
    artist_slug: artist.slug,
    title,
    description: description || '',
    price_cents: parseInt(price_cents),
    archive_price_cents: archive_price_cents ? parseInt(archive_price_cents) : null,
    genres: genres || [],
    tags: tags || [],
    edition_type: edition_type || 'unlimited',
    edition_limit: edition_limit ? parseInt(edition_limit) : null,
    edition_name: edition_name || null,
    bundle_discount_percent: bundle_discount_percent ? parseInt(bundle_discount_percent) : null,
    drop_window_enabled: drop_window_enabled || false,
    drop_window_end: drop_window_end || null,
    cover_url: cover_url || null,
    audio_urls: audio_urls || [],
    track_names: track_names || [],
    track_durations: track_durations || [],
    bpm: bpm || null,
    key: key || null,
    total_sales: 0,
    total_revenue_cents: 0,
    view_count: 0,
    preview_generated: false,
    preview_url: null,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  products.set(productId, newProduct);

  res.status(201).json({
    message: 'Product created successfully',
    product: newProduct,
  });
});

// Update product (artist only)
router.patch('/:id', authenticateToken, requireArtist, (req, res) => {
  const product = products.get(req.params.id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Verify ownership
  let artist = null;
  for (const a of artists.values()) {
    if (a.userId === req.userId) {
      artist = a;
      break;
    }
  }

  if (!artist || product.artist_id !== artist.id) {
    throw new AppError('Not authorized to edit this product', 403);
  }

  const updates = req.body;
  const allowedFields = [
    'title', 'description', 'price_cents', 'archive_price_cents',
    'genres', 'tags', 'edition_type', 'edition_limit', 'edition_name',
    'bundle_discount_percent', 'drop_window_enabled', 'drop_window_end',
    'cover_url', 'audio_urls', 'track_names', 'track_durations',
    'bpm', 'key', 'status'
  ];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      product[field] = updates[field];
    }
  }

  product.updatedAt = new Date().toISOString();
  products.set(req.params.id, product);

  res.json({
    message: 'Product updated successfully',
    product,
  });
});

// Delete product (artist only)
router.delete('/:id', authenticateToken, requireArtist, (req, res) => {
  const product = products.get(req.params.id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Verify ownership
  let artist = null;
  for (const a of artists.values()) {
    if (a.userId === req.userId) {
      artist = a;
      break;
    }
  }

  if (!artist || product.artist_id !== artist.id) {
    throw new AppError('Not authorized to delete this product', 403);
  }

  products.delete(req.params.id);

  res.json({ message: 'Product deleted successfully' });
});

// Get featured products
router.get('/featured/list', (req, res) => {
  const featured = [];
  for (const product of products.values()) {
    if (product.status === 'active' && product.total_sales > 0) {
      featured.push(product);
    }
  }
  
  // Sort by sales and take top 10
  featured.sort((a, b) => b.total_sales - a.total_sales);
  
  res.json({
    products: featured.slice(0, 10),
  });
});

// Get new releases
router.get('/new/releases', (req, res) => {
  const newReleases = [];
  for (const product of products.values()) {
    if (product.status === 'active') {
      newReleases.push(product);
    }
  }
  
  // Sort by creation date
  newReleases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json({
    products: newReleases.slice(0, 10),
  });
});

export default router;
export { products };
