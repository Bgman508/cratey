# Cratey - Base44 to Standalone Migration Guide

## Summary of Changes

This document outlines the complete migration from Base44 platform to a standalone React + Express application.

### Dependencies Removed
- `@base44/sdk` - Replaced with custom Axios-based API client
- `@base44/vite-plugin` - Removed from Vite config

### Dependencies Added/Upgraded
- **Frontend**: React 19, Vite 6, Axios, Framer Motion
- **Backend**: Express 4, JWT, CORS, Helmet, Morgan, Rate Limiting
- **Payments**: Stripe integration for checkout and webhooks
- **Email**: Nodemailer for purchase confirmations
- **Audio**: FFmpeg for preview generation (optional)

## New Backend Structure

```
server/
├── index.js              # Main Express server
├── middleware/
│   ├── auth.js           # JWT authentication
│   └── errorHandler.js   # Global error handling
├── routes/
│   ├── auth.js           # Login/register/me
│   ├── users.js          # User management
│   ├── artists.js        # Artist profiles
│   ├── products.js       # Product CRUD
│   ├── orders.js         # Order management
│   ├── library.js        # Library access
│   ├── stripe.js         # Stripe checkout & webhooks
│   ├── audio.js          # Audio file handling
│   ├── email.js          # Email sending
│   ├── analytics.js      # Dashboard analytics
│   ├── search.js         # Search functionality
│   ├── cart.js           # Shopping cart
│   └── wishlist.js       # Wishlist
└── services/
    └── email.js          # Email templates
```

## API Endpoint Mapping

| Base44 | New Express |
|--------|-------------|
| `base44.auth.me()` | `GET /api/auth/me` |
| `base44.auth.logout()` | `POST /api/auth/logout` |
| `base44.entities.Product.list()` | `GET /api/products` |
| `base44.entities.Product.create()` | `POST /api/products` |
| `base44.entities.Artist.list()` | `GET /api/artists` |
| `base44.entities.Order.list()` | `GET /api/orders` |
| `base44.functions.invoke('createCheckoutSession')` | `POST /api/stripe/create-checkout-session` |
| `base44.functions.invoke('sendPurchaseEmail')` | `POST /api/email/purchase` |

## Frontend Files Updated

### Core Files (✅ Updated)
- `src/api/apiClient.js` - NEW: Centralized API client
- `src/lib/AuthContext.jsx` - Updated for JWT auth
- `src/lib/app-params.js` - Removed base44 references
- `src/lib/NavigationTracker.jsx` - Updated
- `src/lib/PageNotFound.jsx` - Updated

### Pages (⚠️ Partially Updated)
- `src/pages/Home.jsx` - ✅ Updated
- `src/pages/Artists.jsx` - ✅ Updated
- `src/pages/ArtistStorefront.jsx` - ⚠️ Needs update
- `src/pages/ProductPage.jsx` - ⚠️ Needs update
- `src/pages/Library.jsx` - ⚠️ Needs update
- `src/pages/LibraryAccess.jsx` - ⚠️ Needs update
- `src/pages/Dashboard.jsx` - ⚠️ Needs update
- `src/pages/DashboardProducts.jsx` - ⚠️ Needs update
- `src/pages/DashboardOrders.jsx` - ⚠️ Needs update
- `src/pages/DashboardAnalytics.jsx` - ⚠️ Needs update
- `src/pages/DashboardSettings.jsx` - ⚠️ Needs update
- `src/pages/DashboardNewProduct.jsx` - ⚠️ Needs update
- `src/pages/DashboardEditProduct.jsx` - ⚠️ Needs update
- `src/pages/DashboardStripe.jsx` - ⚠️ Needs update
- `src/pages/DashboardPayouts.jsx` - ⚠️ Needs update
- `src/pages/ArtistSignup.jsx` - ⚠️ Needs update
- `src/pages/AdminOrders.jsx` - ⚠️ Needs update

### Components (⚠️ Needs Update)
- `src/components/products/BundleSelector.jsx`
- `src/components/products/BundleOffer.jsx`
- `src/components/dashboard/DashboardLayout.jsx`

## How to Complete the Migration

### 1. Update Remaining Page Files

For each page file, replace:

**Before:**
```javascript
import { base44 } from '@/api/base44Client';

// Auth
const user = await base44.auth.me();
base44.auth.redirectToLogin();

// Entities
const products = await base44.entities.Product.list('-created_date');
const product = await base44.entities.Product.create(data);
await base44.entities.Product.update(id, data);
await base44.entities.Product.delete(id);

// Functions
await base44.functions.invoke('functionName', params);

// Uploads
const { file_url } = await base44.integrations.Core.UploadFile({ file });
```

**After:**
```javascript
import { productAPI, artistAPI, orderAPI, libraryAPI, stripeAPI, authAPI } from '@/api/apiClient';

// Auth
const response = await authAPI.me();
window.location.href = '/login';

// Entities (now via API client)
const response = await productAPI.list({ limit: 20 });
const products = response.data.products;

const response = await productAPI.create(data);
await productAPI.update(id, data);
await productAPI.delete(id);

// Functions (now via API routes)
await stripeAPI.createCheckoutSession(data);

// Uploads (use multer on backend)
// Frontend: Use FormData and axios
// Backend: Handle with multer middleware
```

### 2. Update Component Files

Same pattern as pages - replace `base44` imports and calls with the new API client.

### 3. Test the Application

```bash
# Terminal 1 - Backend
npm run server:dev

# Terminal 2 - Frontend
npm run dev
```

### 4. Environment Variables

Create `.env` file:

```env
# Client
VITE_API_BASE_URL=http://localhost:3001/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key

# Server
PORT=3001
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_key
```

### 5. Stripe Setup

1. Create Stripe account
2. Get API keys from Stripe Dashboard
3. Set up webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
4. For local testing, use Stripe CLI:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```

## New Features Added

1. **Shopping Cart** - Add multiple items before checkout
2. **Wishlist** - Save products for later
3. **Search** - Fuzzy search with suggestions
4. **Analytics** - Dashboard stats for artists
5. **Rate Limiting** - Protect against abuse
6. **Security Headers** - Helmet.js protection

## Known Limitations

1. **In-Memory Storage** - Data resets on server restart (upgrade to database for production)
2. **File Uploads** - Currently not implemented (add multer + S3/Cloudinary)
3. **Audio Previews** - Server-side generation needs FFmpeg setup

## Database Migration Path

To upgrade from in-memory to a real database:

1. Install MongoDB:
   ```bash
   npm install mongodb
   ```

2. Create `server/db.js`:
   ```javascript
   import { MongoClient } from 'mongodb';
   const client = new MongoClient(process.env.MONGODB_URI);
   export const db = client.db('cratey');
   ```

3. Replace in-memory Maps with database queries in each route file.

## Deployment

### Build for Production

```bash
npm run build
NODE_ENV=production npm run server
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "server"]
```

## Support

For issues and questions, please use the GitHub issue tracker.
