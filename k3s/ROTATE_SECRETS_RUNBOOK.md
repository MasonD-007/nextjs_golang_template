# Nextjs Template Secret Rotation Runbook (k3s + ArgoCD + SealedSecrets)

This runbook documents how to rotate Postgres credentials and backend/frontend secrets safely in a GitOps workflow.

## Why this flow

- Secrets in Git must be encrypted (`SealedSecret`), never plaintext `Secret`.
- Postgres on a persisted volume does not re-apply `POSTGRES_PASSWORD` automatically after initial init.
- Rotating `JWT_SECRET` invalidates existing user sessions/tokens immediately.
- Frontend demo secret values are rendered in the UI, so use non-sensitive values only.

---

## Prerequisites

- `kubectl` configured for the target cluster.
- `kubeseal` installed.
- Sealed Secrets controller running as:
  - namespace: `kube-system`
  - name: `sealed-secrets`
- ArgoCD app manages `k3s/` path.
- Target namespace: `nextjs-template`.

Alternative (offline sealing):
- A Sealed Secrets public cert file (for example `~/.cert/cert.pem`) and use `kubeseal --cert <path>`.

---

## Files involved

- Postgres sealed secret: `k3s/base/sealed-postgres-secret.yaml`
- Backend sealed secret: `k3s/apps/backend/sealed-secret.yaml`
- Frontend sealed secret: `k3s/apps/frontend/sealed-secret.yaml`
- Postgres workload: `k3s/apps/postgres/statefulset.yaml`
- Backend workload: `k3s/apps/backend/deployment.yaml`

---

## 1) Generate fresh credentials

Use hex values for URL-safe credentials.

```bash
PG_USER="$(openssl rand -hex 16)"
PG_PASS="$(openssl rand -hex 32)"
JWT_SECRET="$(openssl rand -hex 32)"
DEMO_SECRET_MESSAGE="sealed-secrets wiring works for nextjs-template"

PG_HOST="postgres.nextjs-template.svc.cluster.local"
PG_DB="nextjs-template"
DATABASE_URL="postgres://${PG_USER}:${PG_PASS}@${PG_HOST}:5432/${PG_DB}?sslmode=disable"

# sanity check (do not paste into logs/chat histories)
echo "$DATABASE_URL"
```

---

## 2) Generate and seal Postgres secret

Expected Kubernetes secret name is `postgres-secret`.

Online mode (cluster reachable):

```bash
kubectl create secret generic postgres-secret \
  --namespace=nextjs-template \
  --from-literal=POSTGRES_USER="${PG_USER}" \
  --from-literal=POSTGRES_PASSWORD="${PG_PASS}" \
  --from-literal=POSTGRES_DB="${PG_DB}" \
  --dry-run=client -o yaml \
  | kubeseal \
      --controller-namespace=kube-system \
      --controller-name=sealed-secrets \
      --format=yaml \
      > k3s/base/sealed-postgres-secret.yaml
```

Offline mode (cluster not reachable):

```bash
kubectl create secret generic postgres-secret \
  --namespace=nextjs-template \
  --from-literal=POSTGRES_USER="${PG_USER}" \
  --from-literal=POSTGRES_PASSWORD="${PG_PASS}" \
  --from-literal=POSTGRES_DB="${PG_DB}" \
  --dry-run=client -o yaml \
  | kubeseal \
      --cert /path/to/sealed-secrets-public-cert.pem \
      --format=yaml \
      > k3s/base/sealed-postgres-secret.yaml
```

---

## 3) Generate and seal backend secret

`backend-secrets` must contain both keys each time (full replacement object):
- `DATABASE_URL`
- `JWT_SECRET`

```bash
kubectl create secret generic backend-secrets \
  --namespace=nextjs-template \
  --from-literal=DATABASE_URL="${DATABASE_URL}" \
  --from-literal=JWT_SECRET="${JWT_SECRET}" \
  --dry-run=client -o yaml \
  | kubeseal \
      --controller-namespace=kube-system \
      --controller-name=sealed-secrets \
      --format=yaml \
      > k3s/apps/backend/sealed-secret.yaml
```

Offline mode (cluster not reachable):

```bash
kubectl create secret generic backend-secrets \
  --namespace=nextjs-template \
  --from-literal=DATABASE_URL="${DATABASE_URL}" \
  --from-literal=JWT_SECRET="${JWT_SECRET}" \
  --dry-run=client -o yaml \
  | kubeseal \
      --cert /path/to/sealed-secrets-public-cert.pem \
      --format=yaml \
      > k3s/apps/backend/sealed-secret.yaml
```

---

## 4) Rotate live Postgres password (required with existing PVC)

Because Postgres skips init on existing data dirs, update the user in-place:

**Warning:** Backend authentication will fail until this password is updated to match the sealed `DATABASE_URL`/`POSTGRES_PASSWORD` values.

```bash
kubectl exec -n nextjs-template postgres-0 -- \
  psql -U nextjs-template -d postgres \
  -c "ALTER USER nextjs-template WITH PASSWORD '${PG_PASS}';"
```

If username also changes, rename user explicitly before restarting apps.

---

## 5) Generate and seal frontend demo secret

`frontend-secrets` contains a UI-visible demo value:
- `DEMO_SECRET_MESSAGE`

Shortcut from repo root (uses cert in `.cert/` by default):

```bash
make seal-frontend-secret DEMO_SECRET_MESSAGE="sealed-secrets wiring works for nextjs-template"
```

```bash
kubectl create secret generic frontend-secrets \
  --namespace=nextjs-template \
  --from-literal=DEMO_SECRET_MESSAGE="${DEMO_SECRET_MESSAGE}" \
  --dry-run=client -o yaml \
  | kubeseal \
      --controller-namespace=kube-system \
      --controller-name=sealed-secrets \
      --format=yaml \
      > k3s/apps/frontend/sealed-secret.yaml
```

Offline mode (cluster not reachable):

```bash
kubectl create secret generic frontend-secrets \
  --namespace=nextjs-template \
  --from-literal=DEMO_SECRET_MESSAGE="${DEMO_SECRET_MESSAGE}" \
  --dry-run=client -o yaml \
  | kubeseal \
      --cert /path/to/sealed-secrets-public-cert.pem \
      --format=yaml \
      > k3s/apps/frontend/sealed-secret.yaml
```

---

## 6) Restart workloads to pick up new secrets

```bash
kubectl rollout restart statefulset/postgres -n nextjs-template
kubectl rollout restart deployment/backend -n nextjs-template
kubectl rollout restart deployment/frontend -n nextjs-template

kubectl rollout status statefulset/postgres -n nextjs-template
kubectl rollout status deployment/backend -n nextjs-template
kubectl rollout status deployment/frontend -n nextjs-template
```

---

## 7) Verify

- ArgoCD app status is `Synced` and `Healthy` (or at least backend recovers from prior degraded state).
- Backend can connect to Postgres.
- New logins work (old JWT tokens should fail after JWT rotation).
- Frontend home page renders `DEMO_SECRET_MESSAGE` from env.

Optional checks:

```bash
kubectl get sealedsecret -n nextjs-template
kubectl get secret postgres-secret -n nextjs-template
kubectl get secret backend-secrets -n nextjs-template
kubectl get secret frontend-secrets -n nextjs-template
```

---

## 8) Cleanup plaintext artifacts (if any)

Do not keep plaintext secrets in repo or temp files.

```bash
rm -f plain-secret.yaml plain-postgres-secret.yaml plain-backend-secret.yaml
```

Then confirm what will be committed:

```bash
git status --short
```

Only sealed manifests should be committed.

---

## Notes and pitfalls

- `SealedSecret` scope defaults to strict (name+namespace bound). Keep names/namespaces exact.
- Wrong namespace in sealed output means decryption will not produce the expected secret for workloads.
- `DATABASE_URL` with hex user/pass is URL-safe and avoids escaping issues.
- Rotating `JWT_SECRET` forces re-authentication for all users (expected).
