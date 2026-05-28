# SmartTax Backend API

REST API for the SmartTax platform — a tax management system for businesses in Rwanda.

## Setup

```bash
npm install
cp .env.example .env   # configure your environment variables
npm start              # or: node Server.js
```

## Environment Variables

| Variable          | Description                |
|-------------------|----------------------------|
| `PORT`            | Server port (default 5000) |
| `MONGODB_URI`     | MongoDB connection string  |
| `JWT_SECRET`      | JWT signing secret         |
| `VAPID_PUBLIC_KEY`| Web push public key        |
| `VAPID_PRIVATE_KEY`| Web push private key      |
| `OPENAI_API_KEY`  | OpenAI API key (AI features)|

## API Endpoints

- `POST /api/auth/register` — Register a new user  
- `POST /api/auth/login` — Login  
- `GET /api/businesses` — List businesses  
- `GET /api/products` — List products  
- `POST /api/sales` — Create a sale  
- `GET /api/invoices` — List invoices  
- `POST /api/taxes/pay` — Pay a tax  
- `GET /api/notifications` — List notifications  
- `POST /api/push/subscribe` — Subscribe to push notifications  

See the route files in `routes/` for the full API surface.
