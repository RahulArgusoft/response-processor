# Response Processor

A modular monolithic application for processing inbound communications (email, phone) built with NestJS.

## Architecture

This application follows a **Modular Monolith** architecture, which provides:

- **Single Deployment**: Easy deployment to Render free tier
- **Module Isolation**: Each feature (email, phone) is a self-contained module
- **Shared Infrastructure**: Common config, database, and utilities
- **Future Microservices Ready**: Modules can be extracted to separate services later

```
response-processor/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── health.controller.ts    # Health check endpoints
│   │
│   └── modules/
│       ├── email/              # Email processing module
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── dto/
│       │   ├── entities/
│       │   └── email.module.ts
│       │
│       ├── phone/              # Phone/Twilio module (planned)
│       │
│       └── common/             # Shared infrastructure
│           ├── config/
│           ├── database/
│           └── utils/
│
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- PostgreSQL (optional, for database features)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start in development mode
npm run start:dev
```

### With Docker

```bash
# Start with Docker Compose (includes PostgreSQL)
docker-compose up -d

# Or build and run just the app
docker build -t response-processor .
docker run -p 3000:3000 response-processor
```

## API Endpoints

### Health Checks

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Basic health status |
| `GET /api/health/detailed` | Detailed health with services |
| `GET /api/health/live` | Liveness probe (for K8s/Render) |
| `GET /api/health/ready` | Readiness probe |

### Email Module

| Endpoint | Description |
|----------|-------------|
| `POST /api/email/inbound` | Webhook for inbound emails |
| `GET /api/email/status` | Email module status |

## Deployment to Render

### Option 1: Docker Deployment (Recommended)

1. Push your code to GitHub
2. Create a new **Web Service** on Render
3. Connect your GitHub repository
4. Render will auto-detect the Dockerfile
5. Set environment variables in Render dashboard

### Option 2: Native Deployment

1. Push your code to GitHub
2. Create a new **Web Service** on Render
3. Select **Node** as the environment
4. Set build command: `npm install && npm run build`
5. Set start command: `npm run start:prod`

### Environment Variables (Render)

```
NODE_ENV=production
PORT=10000
DATABASE_URL=<your-database-url>
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=<your-api-key>
```

## Modules

### Email Module (Active)

Handles inbound email processing:
- Parse incoming emails from webhooks
- Process attachments
- Send auto-replies

**Supported Providers**: SendGrid, Mailgun (coming soon)

### Phone Module (Planned)

Will handle phone/SMS communications via Twilio:
- Inbound call handling
- SMS processing
- Voice transcription

## Development

```bash
# Run in development mode
npm run start:dev

# Run tests
npm test

# Run e2e tests
npm run test:e2e

# Lint code
npm run lint

# Format code
npm run format
```

## License

UNLICENSED
