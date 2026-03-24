# Next.js + Go + OpenAPI + SQLC + Kubernetes Template

This repository is a boilerplate for a full-stack application with end-to-end type safety, Kubernetes deployment, and GitOps-ready CI/CD.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router, TypeScript) |
| Backend | Go 1.26 |
| API Contract | OpenAPI / Swagger |
| Database | PostgreSQL 16 + SQLC |
| Container | Docker Compose |
| Orchestration | Kubernetes (k3s) |
| CI/CD | GitHub Actions |
| GitOps | ArgoCD |

## Repository Structure

```
.
├── .github/
│   └── workflows/
│       ├── ci.yml           # Lint + test pipeline
│       ├── release.yml      # Build + push Docker images
│       └── deploy.yml       # Deploy to Kubernetes
├── backend/                 # Go source code
│   ├── cmd/server/         # Main application
│   ├── internal/db/         # Generated SQLC code
│   ├── handlers/            # HTTP handlers
│   ├── docs/                # Generated Swagger docs
│   └── sql/                 # SQL schema and queries
├── frontend/                # Next.js source code
│   └── src/lib/            # OpenAPI client and types
├── k3s/                     # Kubernetes manifests
│   ├── base/                # Namespace, secrets
│   ├── apps/                # Application deployments
│   │   ├── postgres/        # PostgreSQL StatefulSet
│   │   ├── backend/        # Backend deployment
│   │   └── frontend/       # Frontend deployment
│   ├── ingress/            # Ingress rules
│   └── argocd/             # ArgoCD application
├── docker-compose.yml       # Local development stack
└── Makefile                # Development commands
```

## Prerequisites

- Go 1.26+
- Node.js 20+
- Docker & Docker Compose
- [k3d](https://k3d.io/) (for local Kubernetes)
- kubectl

## Configuration

All configuration is managed through a single `.env` file in the repository root.

### Setup

```bash
# Copy the example and edit with your values
cp .env.example .env
nano .env
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GITHUB_OWNER` | Your GitHub username | `johndoe` |
| `GITHUB_REPO` | Repository name | `my-app` |
| `IMAGE_REGISTRY` | Container registry | `ghcr.io` |
| `POSTGRES_USER` | Database username | `app` |
| `POSTGRES_PASSWORD` | Database password | `secure-password` |
| `POSTGRES_DB` | Database name | `appdb` |
| `INGRESS_HOST` | Domain for ingress | `nextjs-template.lan` |

**Note**: The `.env` file is gitignored. Never commit secrets!

## Quick Start

### Local Development (Docker Compose)

```bash
# Install dependencies
make setup

# Start postgres + run both services
make db-start
make dev
```

Or use Docker Compose for everything:

```bash
make dc-up
```

### Local Kubernetes (k3d)

```bash
# Create local k8s cluster
make k3d-create

# Deploy application
make k3d-deploy

# Check status
make k3d-status

# View logs
make k3d-logs-backend

# Clean up
make k3d-delete
```

### Access Services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| Swagger Docs | http://localhost:8080/swagger/index.html |
| App (via ingress) | http://nextjs-template.lan |

## Makefile Commands

### Development

```bash
make setup              # Install all dependencies
make dev                # Run backend + frontend locally
```

### Backend

```bash
make backend-deps       # Install Go dependencies + tools
make backend-dev        # Run backend (go run ./cmd/server/)
make backend-generate   # Generate SQLC code + Swagger docs
make backend-build      # Build binary
make backend-test       # Run tests
```

### Frontend

```bash
make frontend-deps       # Install npm packages
make frontend-dev        # Run dev server
make frontend-build      # Build for production
make frontend-lint       # Run ESLint
```

### Database

```bash
make db-start           # Start postgres container
make db-stop            # Stop postgres
make db-reset           # Reset database (drops all data)
make db-console         # Open psql shell
```

### Docker Compose

```bash
make dc-up              # Start all services
make dc-down            # Stop all services
make dc-rebuild         # Rebuild and restart
make dc-logs            # View all logs
```

### Kubernetes (k3d)

```bash
make k3d-create        # Create local cluster
make k3d-deploy        # Deploy to cluster
make k3d-status        # Check pod/service status
make k3d-logs-backend  # View backend logs
make k3d-delete        # Delete cluster
```

### Code Generation

```bash
make generate           # Generate backend code + sync OpenAPI types
make sync-openapi       # Sync swagger.json to frontend
```

### Cleanup

```bash
make clean              # Remove build artifacts
make clean-all          # Clean + remove volumes
make k3d-delete        # Delete k3d cluster
```

## API Usage (Frontend)

```typescript
import { api } from '@/lib/api';

// List all items
const { data } = await api.get('/items');

// Get single item
const { data } = await api.get('/items', { params: { query: { id: 1 } } });

// Create item
const { data } = await api.post('/items', { 
  body: { name: 'New Item', description: 'Description' } 
});

// Update item
await api.put('/items', { 
  params: { query: { id: 1 } }, 
  body: { name: 'Updated', description: '...' } 
});

// Delete item
await api.delete('/items', { params: { query: { id: 1 } } });
```

## Updating the API

1. Modify handlers in `backend/cmd/server/handlers/`
2. Add/change SQL queries in `backend/sql/query.sql`
3. Regenerate code:

```bash
make generate
```

## Production Deployment

### 1. Configure .env

Set your production values in `.env`:
- `GITHUB_OWNER` = your GitHub username
- `GITHUB_REPO` = your repository name
- `POSTGRES_PASSWORD` = strong password (generate with `openssl rand -base64 32`)

### 2. GitHub Actions CI/CD

| Workflow | Trigger | Action |
|----------|---------|--------|
| `ci.yml` | PR + push to main | Lint + test |
| `release.yml` | push to main | Build + push images to ghcr.io |
| `deploy.yml` | after release | Deploy to Kubernetes |

### Setup for Production

1. **Create GitHub Environment**
   - Go to Settings → Environments → Create `production`
   - Add `KUBE_CONFIG` secret (base64-encoded kubeconfig)

2. **Push to main**
   - CI runs lint + tests
   - Release builds and pushes Docker images
   - Deploy applies manifests to cluster

3. **Verify Deployment**
   ```bash
kubectl get all -n nextjs-template
kubectl get ingress -n nextjs-template
   ```

### Image Registry

Images are pushed to GitHub Container Registry:
- `ghcr.io/{owner}/backend:latest`
- `ghcr.io/{owner}/frontend:latest`

## Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Go Documentation](https://golang.org/doc/)
- [OpenAPI Documentation](https://swagger.io/specification/)
- [SQLC Documentation](https://sqlc.dev/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [k3d Documentation](https://k3d.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
