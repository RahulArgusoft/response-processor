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
├── prisma/                     # Database schema & migrations
├── render.yaml                 # Render deployment config
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- PostgreSQL database

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate Prisma client
npm run prisma:generate

# Run database migrations (if database is set up)
npm run prisma:migrate
```

### Local Development

```bash
# Start in development mode (with hot reload)
npm run start:dev

# Or build and run production-like
npm run build
npm run start:prod
```

This mirrors the production flow on Render.

## Deployment

### How Render Deploys This App

Render uses the `render.yaml` Blueprint for configuration:

```
BUILD PHASE (npm run render:build)
├── npm ci                    # Install dependencies
├── prisma generate           # Generate Prisma client
└── nest build               # Compile TypeScript → dist/

START PHASE (npm run render:start)
├── prisma migrate deploy    # Run pending DB migrations
└── node dist/src/main       # Start the application
```

### Deploy to Render

1. Push your code to GitHub
2. Create a new **Blueprint** on Render
3. Connect your GitHub repository
4. Render auto-detects `render.yaml` and sets everything up

### Environment Variables

Set these in Render dashboard or `.env` locally:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=<your-database-url>
```

## API Endpoints

### Health Checks

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Basic health status |
| `GET /api/health/detailed` | Detailed health with services |
| `GET /api/health/live` | Liveness probe |
| `GET /api/health/ready` | Readiness probe |

### Email Module

| Endpoint | Description |
|----------|-------------|
| `POST /api/email/inbound` | Webhook for inbound emails |
| `GET /api/email/status` | Email module status |

## Modules

### Email Module (Active)

Handles inbound email processing:
- Parse incoming emails from webhooks
- Process attachments
- Send auto-replies

### Phone Module (Planned)

Will handle phone/SMS communications via Twilio:
- Inbound call handling
- SMS processing
- Voice transcription

## Development Commands

```bash
# Development
npm run start:dev          # Start with hot reload

# Production
npm run build              # Build TypeScript
npm run start:prod         # Run compiled app

# Database
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Deploy migrations
npm run prisma:studio      # Open Prisma Studio

# Testing
npm test                   # Run unit tests
npm run test:e2e           # Run e2e tests

# Code Quality
npm run lint               # Lint code
npm run format             # Format code
```

## License

UNLICENSED
