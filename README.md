# Cratey - Music Sample Marketplace

A modern music sample marketplace where artists can sell their sounds and producers can discover high-quality samples. Built with React, Express, and Stripe.

![Cratey](https://via.placeholder.com/800x400?text=Cratey+Music+Marketplace)

## Features

### For Artists
- **Artist Storefront** - Custom profile page with bio, social links, and portfolio
- **Product Management** - Upload and manage sample packs, loops, and one-shots
- **Edition Types** - Sell unlimited copies or limited editions
- **Drop Windows** - Time-limited releases with special pricing
- **Bundle Discounts** - Offer discounts when customers buy multiple products
- **Analytics Dashboard** - Track sales, revenue, and product performance
- **92% Artist Payout** - Industry-leading revenue share

### For Buyers
- **Browse & Discover** - Search by genre, artist, or tags
- **Audio Previews** - Listen before you buy
- **Library Access** - Lifetime access to purchased samples
- **Wishlist** - Save products for later
- **Cart** - Buy multiple items at once
- **Secure Checkout** - Stripe-powered payments

### Product Features
- **Limited Editions** - Scarcity-driven collectibles
- **Drop Windows** - Flash sales with countdown timers
- **Bundle Offers** - Multi-buy discounts
- **Genre Tags** - Easy categorization
- **BPM & Key Info** - Production-ready metadata

## Tech Stack

### Frontend
- React 19 + Vite 6
- Tailwind CSS 3.4 + shadcn/ui components
- Framer Motion for animations
- React Query for data fetching
- React Router v7 for navigation
- Stripe React for payments

### Backend
- Node.js + Express 4
- JWT authentication
- In-memory storage (easily upgradable to database)
- Stripe integration for payments
- Nodemailer for emails
- Rate limiting and security middleware

## Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- Stripe account (for payments)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cratey.git
cd cratey
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Start the development servers:

**Terminal 1 - Backend:**
```bash
npm run server:dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

5. Open http://localhost:3000 in your browser

## Environment Variables

### Client (.env)
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

### Server (.env)
```env
PORT=3001
CLIENT_URL=http://localhost:3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key

# Stripe (required for payments)
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Project Structure

```
cratey/
├── src/
│   ├── api/
│   │   └── apiClient.js          # Centralized API client
│   ├── components/
│   │   ├── artists/              # Artist-related components
│   │   ├── audio/                # Audio player components
│   │   ├── dashboard/            # Dashboard components
│   │   ├── library/              # Library components
│   │   ├── products/             # Product components
│   │   ├── search/               # Search components
│   │   └── ui/                   # shadcn/ui components
│   ├── lib/
│   │   ├── AuthContext.jsx       # Authentication context
│   │   ├── NavigationTracker.jsx
│   │   └── query-client.js
│   ├── pages/                    # Main pages
│   │   ├── Home.jsx
│   │   ├── Artists.jsx
│   │   ├── ProductPage.jsx
│   │   ├── Library.jsx
│   │   ├── Dashboard.jsx
│   │   └── ...
│   ├── App.jsx
│   └── main.jsx
├── server/                       # Express backend
│   ├── index.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── artists.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── library.js
│   │   ├── stripe.js
│   │   └── ...
│   └── services/
│       └── email.js
├── package.json
├── vite.config.js
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Artists
- `GET /api/artists` - List artists
- `GET /api/artists/:id` - Get artist by ID
- `GET /api/artists/slug/:slug` - Get artist by slug
- `POST /api/artists/signup` - Sign up as artist
- `PATCH /api/artists/profile` - Update artist profile

### Products
- `GET /api/products` - List products (with filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (artist only)
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/featured/list` - Get featured products
- `GET /api/products/new/releases` - Get new releases

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get single order
- `PATCH /api/orders/:id/status` - Update order status

### Library
- `GET /api/library` - Get user's library
- `POST /api/library/verify` - Verify library access

### Stripe
- `POST /api/stripe/create-checkout-session` - Create checkout session
- `POST /api/stripe/webhook` - Stripe webhook handler

### Search
- `GET /api/search?q=query` - Search products and artists
- `GET /api/search/suggestions` - Get search suggestions

## Customization

### Adding New Features

1. Create backend route in `server/routes/`
2. Add API method in `src/api/apiClient.js`
3. Create frontend component in `src/components/`
4. Add page in `src/pages/`

### Changing Payment Provider

To switch from Stripe to another provider:

1. Update `server/routes/stripe.js`
2. Update frontend Stripe components
3. Update environment variables

### Upgrading to Database

The current implementation uses in-memory storage. To upgrade:

1. Install database driver:
```bash
npm install mongodb  # or pg, mysql2, etc.
```

2. Create database connection in `server/db.js`

3. Replace in-memory Maps with database queries

## Deployment

### Build for Production

```bash
# Build frontend
npm run build

# Start production server
NODE_ENV=production npm run server
```

### Docker Deployment

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

### Stripe Webhook Setup

1. Install Stripe CLI:
```bash
stripe login
```

2. Forward webhooks to local server:
```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

3. Copy the webhook signing secret to your `.env` file

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) components
- Icons from [Lucide](https://lucide.dev/)
- Payments powered by [Stripe](https://stripe.com/)

## Support

For issues and feature requests, please use the GitHub issue tracker.

---

**Note**: This project was migrated from Base44 to a standalone React + Express application. All Base44 dependencies have been removed and replaced with custom implementations.
