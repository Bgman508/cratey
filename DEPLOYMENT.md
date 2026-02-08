# CRATEY - Production Deployment Guide

## Prerequisites

- Node.js 20+
- A server (VPS, AWS, DigitalOcean, etc.)
- Domain name (required for Stripe webhooks)
- SSL certificate (required for Stripe - Let's Encrypt is free)
- Stripe account (https://stripe.com)

## Environment Setup

### 1. Generate JWT Secret

```bash
openssl rand -base64 64
```

Copy this value for the `JWT_SECRET` environment variable.

### 2. Get Stripe API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Create a new secret key
3. Get your publishable key
4. Create a webhook endpoint and get the signing secret

### 3. Create Production .env File

```bash
cp .env.example .env
```

Edit `.env` with your production values:

```env
VITE_API_BASE_URL=https://your-api-domain.com/api
PORT=3001
CLIENT_URL=https://your-frontend-domain.com
NODE_ENV=production
JWT_SECRET=your-generated-secret-here
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

### 4. Configure Stripe Webhook

In your Stripe Dashboard:
1. Go to Developers > Webhooks
2. Add endpoint: `https://your-api-domain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`

## Deployment Steps

### Option 1: Manual Deployment

1. **Clone the repository on your server**
   ```bash
   git clone https://github.com/Bgman508/cratey.git
   cd cratey
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the frontend**
   ```bash
   npm run build
   ```

4. **Create uploads directory**
   ```bash
   mkdir -p uploads
   chmod 755 uploads
   ```

5. **Start the server**
   ```bash
   npm run server
   ```

### Option 2: PM2 (Recommended)

1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Create ecosystem file**
   ```bash
   cat > ecosystem.config.js << 'EOF'
   module.exports = {
     apps: [{
       name: 'cratey-server',
       script: './server/index.js',
       instances: 1,
       autorestart: true,
       watch: false,
       max_memory_restart: '1G',
       env: {
         NODE_ENV: 'production',
         PORT: 3001
       }
     }]
   };
   EOF
   ```

3. **Start with PM2**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### Option 3: Docker

1. **Create Dockerfile**
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   RUN mkdir -p uploads && chmod 755 uploads
   EXPOSE 3001
   CMD ["node", "server/index.js"]
   ```

2. **Build and run**
   ```bash
   docker build -t cratey .
   docker run -p 3001:3001 --env-file .env -v $(pwd)/uploads:/app/uploads cratey
   ```

## Nginx Configuration (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Client max body size for uploads
    client_max_body_size 50M;

    location / {
        root /path/to/cratey/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # For file uploads
        client_max_body_size 50M;
        proxy_request_buffering off;
    }

    location /uploads {
        alias /path/to/cratey/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Database Migration (Optional)

To migrate from in-memory storage to a real database:

1. Install database driver (e.g., PostgreSQL)
   ```bash
   npm install pg
   ```

2. Update storage layer in `server/routes/*.js`
3. Add database connection to `server/index.js`

## Security Checklist

- [ ] JWT_SECRET is a strong random string
- [ ] Stripe keys are live (not test) keys
- [ ] Stripe webhook is configured
- [ ] NODE_ENV is set to 'production'
- [ ] SSL certificate is configured
- [ ] Firewall rules are set (only allow ports 80, 443, SSH)
- [ ] Uploads directory has proper permissions
- [ ] Regular security updates (`npm audit fix`)

## Email Configuration (Optional)

For purchase confirmation emails:

1. Set up SMTP credentials in `.env`
2. Test email sending
3. Customize email templates in `server/services/email.js`

## Monitoring

```bash
# View logs
pm2 logs cratey-server

# Monitor resources
pm2 monit
```

## Troubleshooting

### Server won't start
- Check if JWT_SECRET is set
- Check if Stripe keys are valid
- Check if port 3001 is available
- Check logs: `pm2 logs`

### Payments not working
- Verify Stripe keys are live (not test)
- Check webhook endpoint is configured correctly
- Verify webhook secret matches

### File uploads failing
- Check uploads directory exists and is writable
- Verify `client_max_body_size` in Nginx config
- Check file size limits in `.env`

### Frontend not loading
- Verify build completed: `npm run build`
- Check Nginx configuration
- Verify dist folder exists
