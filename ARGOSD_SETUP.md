# ArgoCD Production Setup Guide

This guide covers setting up ArgoCD on your Kubernetes cluster for GitOps-based deployment.

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured to access your cluster
- GitHub repository: `https://github.com/MasonD-007/nextjs_golang_template`

## Step 1: Install ArgoCD

### Option A: Using kubectl (Official Method)

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for deployment
kubectl wait --for=condition=available --timeout=600s deployment/argocd-server -n argocd
```

### Option B: Using Helm

```bash
# Add ArgoCD Helm repository
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update

# Install ArgoCD
helm install argocd argo/argo-cd -n argocd --create-namespace
```

## Step 2: Access ArgoCD UI

### Option A: Port Forward (for testing)

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Then open: https://localhost:8080

### Option B: LoadBalancer (for production)

```bash
# Patch service to LoadBalancer
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'

# Get external IP
kubectl get svc argocd-server -n argocd
```

### Option C: Ingress (Recommended)

```bash
# Create ingress for ArgoCD
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-server-ingress
  namespace: argocd
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/backend-protocol: HTTPS
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  rules:
  - host: argocd.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: argocd-server
            port:
              number: 443
EOF
```

## Step 3: Get Initial Admin Password

```bash
# Get initial password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo
```

Default username: `admin`

**Important**: Change the password after first login!

```bash
# Change password
argocd login argocd.yourdomain.com --username admin --password <INITIAL_PASSWORD>
argocd account update-password --current-password <INITIAL_PASSWORD> --new-password <NEW_PASSWORD>
```

## Step 4: Configure GitHub Repository Access

### Generate SSH Key for ArgoCD

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "argocd@github.com" -f /tmp/argocd-github-key -N ""

# Get public key
cat /tmp/argocd-github-key.pub
```

### Add SSH Key to GitHub

1. Go to: https://github.com/MasonD-007/nextjs_golang_template/settings/keys
2. Click "Add deploy key"
3. Title: `ArgoCD Production`
4. Key: Paste the public key from above
5. Check "Allow write access" (needed for auto-sync)
6. Click "Add key"

### Add SSH Key to ArgoCD

```bash
# Create secret with private key
kubectl create secret generic github-ssh-key -n argocd \
  --from-file=ssh-privatekey=/tmp/argocd-github-key \
  --from-file=ssh-publickey=/tmp/argocd-github-key.pub

# Label secret for ArgoCD
kubectl label secret github-ssh-key -n argocd argocd.argoproj.io/secret-type=repository

# Create repository connection
argocd repo add git@github.com:MasonD-007/nextjs_golang_template.git \
  --ssh-private-key-path /tmp/argocd-github-key \
  --name github-prod
```

## Step 5: Apply the ArgoCD Application

```bash
# Apply the application manifest
kubectl apply -f k3s/argocd/application.yaml -n argocd

# Verify application is created
kubectl get application -n argocd
```

## Step 6: Verify Deployment

```bash
# Check application status
kubectl get application app -n argocd -o yaml

# Wait for sync
argocd app wait app -n argocd

# Check deployed resources
kubectl get all -n app
kubectl get ingress -n app
```

## Step 7: Configure GitHub Secrets

Go to: https://github.com/MasonD-007/nextjs_golang_template/settings/secrets

### Create Secret: KUBE_CONFIG

```bash
# Get your kubeconfig
kubectl config view --raw | base64 | tr -d '\n'

# Copy output and paste as KUBE_CONFIG in GitHub secrets
```

### Create Secret: GH_PAT

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes:
   - `repo` - Full control of private repositories
   - `workflow` - Update GitHub Action workflows
4. Generate token
5. Copy token and paste as `GH_PAT` in GitHub secrets

## Step 8: Verify End-to-End Flow

### Test the complete pipeline:

1. Make a change to your code
2. Create a PR and merge to main
3. Release workflow builds and pushes images
4. Deploy workflow updates manifests with commit SHA
5. ArgoCD detects changes and auto-syncs
6. Check ArgoCD UI for sync status

### Monitor logs:

```bash
# ArgoCD application controller logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller

# ArgoCD repo server logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-repo-server

# Application sync status
kubectl get application app -n argocd -o jsonpath='{.status.sync.status}'
```

## Troubleshooting

### Application stuck in "OutOfSync"

```bash
# Force sync
argocd app sync app -n argocd

# Check diff
argocd app diff app -n argocd
```

### Permission denied accessing GitHub

```bash
# Verify SSH key is added
argocd repo list -n argocd

# Test connection
argocd repo get git@github.com:MasonD-007/nextjs_golang_template.git -n argocd
```

### Images not pulling

```bash
# Check image pull errors
kubectl describe pods -n app

# Verify GitHub Container Registry access
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=MasonD-007 \
  --docker-password=<GITHUB_TOKEN> \
  -n app
```

## Architecture Overview

```
Git Push to main
      ↓
GitHub Actions: Release Workflow
      ↓
Build & Push Images to ghcr.io
      ↓
GitHub Actions: Deploy Workflow
      ↓
Update manifests with commit SHA
      ↓
Commit & Push to main
      ↓
ArgoCD detects changes
      ↓
Auto-sync to Kubernetes
      ↓
Deployment Updated
```

## Useful Commands

```bash
# Force sync
argocd app sync app -n argocd

# View application details
argocd app get app -n argocd

# View application events
kubectl describe application app -n argocd

# Rollback to previous version
argocd app rollback app -n argocd <revision>

# View resource tree
argocd app resources app -n argocd

# Delete application (keeps resources)
argocd app delete app -n argocd
```

## Security Recommendations

1. **Enable SSO**: Configure GitHub SSO for ArgoCD
2. **RBAC**: Set up RBAC policies for ArgoCD users
3. **TLS**: Use valid TLS certificates for ArgoCD UI
4. **Network Policies**: Restrict ArgoCD namespace access
5. **Secrets**: Rotate SSH keys and tokens regularly
6. **Backup**: Regularly backup ArgoCD application definitions

## Next Steps

- [ ] Set up monitoring and alerting
- [ ] Configure ArgoCD notifications
- [ ] Implement ArgoCD RBAC policies
- [ ] Set up ArgoCD backup
- [ ] Document rollback procedures

## Resources

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [GitOps Best Practices](https://www.gitops.tech/)
- [ArgoCD Examples](https://github.com/argoproj/argocd-example-apps)
