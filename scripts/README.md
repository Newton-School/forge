# scripts/

Operational helper scripts. Suggested set (to add as the build-out proceeds):

| Script | Purpose |
|---|---|
| `dev.sh` | `docker compose up --build` for the full local stack |
| `migrate.sh` | run Prisma migrations against the target DB |
| `seed.sh` | seed reference/admin-allowlist data |
| `build-and-push.sh <app> <env>` | build the Docker image and push to ECR (mirrors CI) |
| `bootstrap-secrets.sh <env>` | create/update `/forge/<env>/*` secrets in Secrets Manager |

CI/CD performs build + deploy automatically — see [`../.github/workflows/deploy.yml`](../.github/workflows/deploy.yml). These scripts are for local/manual ops.
