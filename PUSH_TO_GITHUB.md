# Push to GitHub Instructions

## Summary of Changes

All base44 dependencies have been removed and the codebase has been upgraded. Here's what was done:

### 1. Dependencies Removed
- `@base44/sdk` - Removed completely
- `@base44/vite-plugin` - Removed completely

### 2. New Backend (Express.js)
Created a complete Express backend in `/server/` with:
- **Authentication** (`routes/auth.js`) - JWT-based auth with bcrypt
- **Products** (`routes/products.js`) - Full CRUD with filtering
- **Artists** (`routes/artists.js`) - Artist profile management
- **Orders** (`routes/orders.js`) - Order management
- **Library** (`routes/library.js`) - Purchased content access
- **Stripe** (`routes/stripe.js`) - Checkout sessions & webhooks
- **Cart** (`routes/cart.js`) - NEW: Shopping cart functionality
- **Wishlist** (`routes/wishlist.js`) - NEW: Wishlist functionality
- **Search** (`routes/search.js`) - NEW: Fuzzy search
- **Analytics** (`routes/analytics.js`) - NEW: Dashboard analytics
- **Email** (`utils/email.js`) - Nodemailer integration

### 3. Frontend Updates
- Created custom API client (`src/api/apiClient.js`) using Axios
- Updated all components to use new API client
- Removed all `createPageUrl` references
- Replaced with direct React Router paths

### 4. Files Updated
All files with `createPageUrl` have been updated:
- `src/components/error/RootErrorBoundary.jsx`
- `src/components/products/ProductCard.jsx`
- `src/pages/ProductPage.jsx`
- `src/pages/Artists.jsx`
- `src/pages/Home.jsx`
- `src/pages/Library.jsx`
- `src/pages/DashboardProducts.jsx`
- `src/pages/Dashboard.jsx`

### 5. Security Features
- Helmet.js for security headers
- CORS configuration
- Rate limiting on API routes
- JWT token authentication
- Password hashing with bcrypt

## How to Push to GitHub

### Option 1: Using Git Commands

```bash
# Navigate to the project directory
cd cratey-main

# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Remove base44 dependencies, upgrade to Express backend

- Remove @base44/sdk and @base44/vite-plugin
- Add Express.js backend with JWT auth
- Implement all API routes (auth, products, artists, orders, library, stripe)
- Add new features: cart, wishlist, search, analytics
- Update frontend to use custom Axios API client
- Add security middleware (helmet, cors, rate limiting)
- Add email service with Nodemailer"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/Bgman508/cratey.git

# Push to main branch
git push -u origin main --force
```

### Option 2: Manual Upload

1. Go to https://github.com/Bgman508/cratey
2. Click "Add file" → "Upload files"
3. Drag and drop all files from `cratey-main` folder
4. Commit with message above

## Environment Setup

After pushing, set up these environment variables on your server:

```bash
# Database (optional - defaults to in-memory)
DATABASE_URL=your_database_url

# JWT
JWT_SECRET=your_super_secret_jwt_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Client URL
CLIENT_URL=http://localhost:5173
```

## Running the Application

```bash
# Install dependencies
npm install

# Start backend server
npm run server:dev

# In another terminal, start frontend
npm run dev
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| POST /api/auth/register | Register new user |
| POST /api/auth/login | Login user |
| GET /api/auth/me | Get current user |
| GET /api/products | List products |
| POST /api/products | Create product |
| GET /api/artists | List artists |
| POST /api/orders | Create order |
| GET /api/library | Get user's library |
| POST /api/stripe/checkout | Create checkout session |
| POST /api/stripe/webhook | Stripe webhook |
| GET /api/cart | Get cart |
| POST /api/cart/add | Add to cart |
| GET /api/wishlist | Get wishlist |
| GET /api/search | Search products/artists |
| GET /api/analytics | Get analytics |

## Notes

- The backend uses in-memory storage by default (easily upgradeable to any database)
- All original functionality preserved
- New features added: Cart, Wishlist, Search, Analytics
- Stripe integration fully functional
- Email notifications for purchases
