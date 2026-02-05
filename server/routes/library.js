import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middleware/errorHandler.js';
import { products } from './products.js';

const router = express.Router();

// In-memory storage
const libraryItems = new Map();

// Get user's library
router.get('/', (req, res) => {
  const { email } = req.query;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const items = [];
  for (const item of libraryItems.values()) {
    if (item.buyer_email === email.toLowerCase()) {
      items.push(item);
    }
  }

  // Sort by purchase date descending
  items.sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date));

  res.json({
    items,
    total: items.length,
  });
});

// Get single library item
router.get('/:id', (req, res) => {
  const item = libraryItems.get(req.params.id);

  if (!item) {
    throw new AppError('Library item not found', 404);
  }

  res.json(item);
});

// Verify library access
router.post('/verify', (req, res) => {
  const { email, product_id } = req.body;

  if (!email || !product_id) {
    throw new AppError('Email and product_id are required', 400);
  }

  const hasAccess = Array.from(libraryItems.values()).some(
    item => item.buyer_email === email.toLowerCase() && item.product_id === product_id
  );

  res.json({ hasAccess });
});

// Create library item (called from webhook)
export const createLibraryItem = async (itemData) => {
  const itemId = uuidv4();
  const accessToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
  
  const newItem = {
    id: itemId,
    ...itemData,
    access_token: accessToken,
    download_count: 0,
    createdAt: new Date().toISOString(),
  };

  libraryItems.set(itemId, newItem);
  return newItem;
};

// Increment download count
router.post('/:id/download', (req, res) => {
  const item = libraryItems.get(req.params.id);

  if (!item) {
    throw new AppError('Library item not found', 404);
  }

  item.download_count = (item.download_count || 0) + 1;
  item.last_downloaded = new Date().toISOString();
  libraryItems.set(req.params.id, item);

  res.json({
    message: 'Download counted',
    download_count: item.download_count,
  });
});

// Get library access URL
router.get('/:id/access', (req, res) => {
  const { token } = req.query;
  const item = libraryItems.get(req.params.id);

  if (!item) {
    throw new AppError('Library item not found', 404);
  }

  // Verify access token
  if (item.access_token !== token) {
    throw new AppError('Invalid access token', 403);
  }

  res.json({
    item,
    access_granted: true,
  });
});

export default router;
export { libraryItems };
