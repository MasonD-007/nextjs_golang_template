# Production Deployment Quick Start

Quick deployment guide for production with ArgoCD.

## Prerequisites Checklist

- [ ] Kubernetes cluster running (v1.24+)
- [ ] kubectl configured with your cluster
- [ ] GitHub account with repo access
- [ ] Domain name for ingress (optional)

## Step-by-Step Deployment

### 1. Install ArgoCD (Run once)

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for deployment
kubectl wait --for=condition=available --timeout=600s deployment/argocd-server -n argocd
```

### 2. Get Admin Credentials

```bash
# Get initial password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo

# Username: admin
```

### 3. Access ArgoCD UI

```bash
# Port forward for local access
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Open: https://localhost:8080
```

### 4. Configure GitHub Access (SSH Key)

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "argocd@github.com" -f /tmp/argocd-key -N ""

# Add public key to GitHub:
# Settings → Deploy keys → Add deploy key
# URL: https://github.com/MasonD-007/nextjs_golang_template/settings/keys
cat /tmp/argocd-key.pub
```

### 5. Add SSH Key to ArgoCD

```bash
# Create secret in ArgoCD
kubectl create secret generic github-ssh -n argocd \
  --from-file=ssh-privatekey=/tmp/argocd-key \
  --from-file=ssh-publickey=/tmp/argocd-key.pub

# Label it
kubectl label secret github-ssh -n argocd argocd.argoproj.io/secret-type=repo-creds
```

### 6. Deploy Application

```bash
# Apply the ArgoCD Application
kubectl apply -f k3s/argocd/application.yaml -n argocd

# Verify
kubectl get application -n argocd
```

### 7. Configure GitHub Secrets

Go to: https://github.com/MasonD-007/nextjs_golang_template/settings/secrets/actions

Add these secrets:

**KUBE_CONFIG:**
```bash
# Get your kubeconfig and base64 encode it
kubectl config view --raw | base64 | tr -d '\n'
# Copy output to GitHub secret
```

**GH_PAT:**
```
1. Go to: https://github.com/settings/tokens
2. Generate token with scopes: repo, workflow
3. Copy token to GitHub secret
```

### 8. Test Deployment

```bash
# Check ArgoCD app status
kubectl get application app -n argocd

# Check deployed resources
kubectl get all -n app
```

## What Happens Next?

When you push to main:
1. **Release workflow** builds images with commit SHA
2. **Deploy workflow** updates manifests with new SHA
3. **ArgoCD** detects changes and auto-syncs
4. **New deployment** rolls out automatically

## Common Issues

### Application stuck in "OutOfSync"
```bash
argocd app sync app -n argocd
```

### Images not pulling
```bash
# Check pod status
kubectl describe pods -n app

# Check image pull errors
kubectl get events -n app --field-selector type=Warning
```

### Permission denied
```bash
# Verify SSH key
argocd repo list -n argocd
```

## Useful URLs

| Service | Command/URL |
|---------|--------------|
| ArgoCD UI | `kubectl port-forward svc/argocd-server -n argocd 8080:443` |
| Application | http://your-domain.com (check ingress) |
| GitHub Secrets | https://github.com/MasonD-007/nextjs_golang_template/settings/secrets |
| ArgoCD Docs | https://argo-cd.readthedocs.io/ |

## Next Steps

- [ ] Configure TLS/HTTPS for production domain
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure backups
- [ ] Document rollback procedures

See full guide: [ARGOSD_SETUP.md](ARGOSD_SETUP.md)
