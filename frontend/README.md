# Frontend

Next.js 16 frontend for the Next.js + Go + OpenAPI + Kubernetes template.

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- OpenAPI-generated types and API client
- Server Actions for backend communication

## Getting Started

```bash
cd frontend
npm run dev
```

Or from the repository root:

```bash
make frontend-dev
```

The frontend runs at http://localhost:3000 and communicates with the backend API at http://localhost:8080.

## Folder Structure

```
frontend/src/
├── app/                  # Next.js App Router pages
├── components/           # React components
│   └── ItemsList.tsx    # Example component
└── lib/                  # API and utilities
    ├── api.ts           # OpenAPI client wrapper
    ├── actions.ts       # Server Actions
    ├── logger.ts        # Logging utility
    ├── openapi.ts       # Generated OpenAPI client
    └── openapi.json     # OpenAPI spec (synced from backend)
```

## API Usage

The frontend uses an OpenAPI-generated client. Run `make sync-openapi` from the root to regenerate types after backend changes.

```typescript
import { api } from '@/lib/api';

// List items
const { data } = await api.get('/items');

// Create item
const { data } = await api.post('/items', {
  body: { name: 'New Item', description: '...' }
});
```

See the [main README](../README.md) for full project documentation.
