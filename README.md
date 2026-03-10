# 🚀 Next.js + Go + ConnectRPC + SQLC + GitOps Template

This repository is a boilerplate for a highly modern, end-to-end type-safe, and GitOps-driven full-stack application. It is designed to eliminate boilerplate (no handwritten fetch requests, no database ORMs) and achieve absolute production parity in local development.

## 🛠️ The Tech Stack

* **Frontend:** [Next.js](https://nextjs.org/) (App Router, TypeScript)
* **Backend:** [Golang](https://go.dev/)
* **API Contract:** [ConnectRPC](https://connectrpc.com/) & [Protocol Buffers](https://protobuf.dev/) (Managed by [Buf](https://buf.build/))
* **Database:** PostgreSQL + [SQLC](https://sqlc.dev/) (Raw SQL compiled to type-safe Go)
* **Local Infra:** [K3s](https://k3s.io/) (Lightweight Kubernetes)
* **Deployment:** [Argo CD](https://argo-cd.readthedocs.io/) (GitOps)

## 📁 Repository Structure

* `/backend` - Go source code, SQL queries, and SQLC configuration.
* `/frontend` - Next.js source code and generated ConnectRPC TypeScript clients.
* `/proto` - The absolute Single Source of Truth for our APIs (.proto files).
* `/k8s` - Kubernetes manifests (Deployments, Services) and Argo CD Application definitions.

## 🚦 Prerequisites

To develop locally, you will need the following CLI tools installed:
* `go` (v1.21+)
* `node` (v20+) & `npm`/`pnpm`
* `buf` (Buf CLI for Protocol Buffers)
* `sqlc` (SQLC compiler)
* [Optional but recommended] Docker & a local K3s environment (like Rancher Desktop or k3d)

## 🏁 Getting Started

### 1. Define the API & Generate Code
We define our APIs in the `/proto` directory. Whenever you update a `.proto` file, regenerate the Go and TypeScript clients:

```bash
cd proto
buf generate
```
