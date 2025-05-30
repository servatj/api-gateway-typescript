# API Gateway

A TypeScript-based API Gateway for routing requests to microservices including Auth and Transcriber services.

## Features

- 🚀 **Express.js** with TypeScript
- 🔒 **Security** with Helmet, CORS, and Rate Limiting
- 🔄 **Proxy** requests to microservices
- 📝 **Logging** with Winston
- 🛡️ **Error Handling** with custom middleware
- 🔐 **Authentication** middleware
- ⚡ **Health Checks** for services
- 🗜️ **Compression** and optimization

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Auth Service
All auth endpoints are proxied to the auth service:
```
POST /auth/signup
POST /auth/signin
POST /auth/login
GET /auth/profile
POST /auth/logout
```

### Transcriber Service (Requires Auth)
All transcriber endpoints require authentication:
```
GET /transcriber/transcript/:id
POST /transcriber/transcript
DELETE /transcriber/transcript/:id
```

## Service Configuration

Configure your microservices in the `.env` file:

```env
AUTH_SERVICE_URL=http://localhost:3001
TRANSCRIBER_SERVICE_URL=http://localhost:3002
```

## Architecture

```
Client Request
      ↓
API Gateway (Port 3000)
      ↓
┌─────────────────────────────┐
│     Route Matching          │
├─────────────────────────────┤
│ /auth/* → Auth Service      │
│ /transcriber/* → Transcriber│
└─────────────────────────────┘
      ↓
Middleware Chain
- Authentication
- Rate Limiting  
- Logging
- Error Handling
      ↓
Proxy to Microservice
      ↓
Response to Client
```

## Development

```bash
# Run with hot reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Gateway port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `AUTH_SERVICE_URL` | Auth service URL | `http://localhost:3001` |
| `TRANSCRIBER_SERVICE_URL` | Transcriber service URL | `http://localhost:3002` |
| `LOG_LEVEL` | Logging level | `info` |
| `ALLOWED_ORIGINS` | CORS origins | `*` |

## Examples

### Making Requests

```bash
# Auth signup
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Get transcript (with auth)
curl -X GET http://localhost:3000/transcriber/transcript/1234123 \
  -H "Authorization: Bearer your-jwt-token"
```

## Monitoring

The gateway includes comprehensive logging and health checks:

- Health endpoint: `GET /health`
- Logs are written to `logs/` directory
- Request/response logging with Morgan
- Error tracking with Winston

## Security

- **Helmet**: Sets security headers
- **CORS**: Configurable cross-origin requests
- **Rate Limiting**: IP-based request limiting
- **Authentication**: Token validation middleware
- **Input Validation**: Request size limits

## License

MIT
